import sax from "sax";
import {Pool} from "pg";
import {randomUUID} from "node:crypto";
import {normalize,type Raw} from "./supplier";

const FEED="https://smtm.com.ua/_prices/import-retail-ua-2.xml";
export async function syncSupplierFeed(){
 const connectionString=process.env.DATABASE_URL_UNPOOLED||process.env.DATABASE_URL;
 if(!connectionString)throw Error("PostgreSQL not configured");
 const db=new Pool({connectionString,max:3,connectionTimeoutMillis:12000,ssl:connectionString.includes("localhost")?false:{rejectUnauthorized:false}});
 const lockClient=await db.connect();
 const syncId=randomUUID();
 let locked=false;
 let processed=0;
 const start=Date.now();
 try{
  const lock=await lockClient.query("SELECT pg_try_advisory_lock(937421) AS locked");
  if(!lock.rows[0]?.locked)return {skipped:true,reason:"Another synchronization is running"};
  locked=true;
  await db.query("SELECT is_active FROM store_products LIMIT 1");
  const resp=await fetch(FEED,{cache:"no-store",headers:{"Accept":"application/xml,text/xml"},signal:AbortSignal.timeout(240000)});
  if(!resp.ok||!resp.body)throw Error("Supplier HTTP "+resp.status);
  const parser=sax.parser(false,{lowercase:true,trim:true});
  const stack:string[]=[];
  let current:Raw|null=null;
  let depth=-1;
  let paramKey="";
  let batch:NonNullable<ReturnType<typeof normalize>>[]=[];
  const clean=(s:string)=>s.replace(/<[^>]*>/g," ").trim();
  parser.onerror=error=>{throw error};
  parser.onopentag=node=>{
   const tag=node.name.toLowerCase();stack.push(tag);
   if(current&&tag==="param")paramKey=String(node.attributes["name"]||node.attributes["NAME"]||"").slice(0,100);
   if(["offer","product","item","товар"].includes(tag)&&!current){
    const attrs:Record<string,string>={};for(const [k,v] of Object.entries(node.attributes))attrs[k.toLowerCase()]=String(v);
    current={attrs,data:{},images:[],specs:{}};depth=stack.length;
   }
  };
  const onText=(text:string)=>{
   if(!current||stack.length<=depth)return;
   const tag=stack[stack.length-1];const previous=current.data[tag]||"";
   if(previous.length<5000)current.data[tag]=(previous+text).slice(0,5000);
  };
  parser.ontext=onText;parser.oncdata=onText;
  parser.onclosetag=name=>{
   const tag=name.toLowerCase();
   if(current&&tag==="param"&&paramKey){
    const value=clean(current.data.param||"");if(value)current.specs[paramKey]=value.slice(0,300);
    delete current.data.param;paramKey="";
   }
   if(current&&["picture","image","photo","img"].includes(tag)&&stack.length>depth){
    const url=current.data[tag]?.trim();if(url)current.images.push(url);delete current.data[tag];
   }
   if(current&&stack.length===depth&&["offer","product","item","товар"].includes(tag)){
    const p=normalize(current);if(p)batch.push(p);
    current=null;depth=-1;
   }
   stack.pop();
  };
  async function flush(){
   if(!batch.length)return;
   const chunk=batch;
   batch=[];
   const items=chunk.map(p=>({id:p.id,name:p.name,category:p.category,sku:p.sku||"",price:p.price,payload:p}));
   await db.query("INSERT INTO store_products(id,name,category,sku,price,payload,updated_at,last_sync_id,is_active) SELECT id,name,category,sku,price,payload,now(),$2::uuid,true FROM jsonb_to_recordset($1::jsonb) AS item(id text,name text,category text,sku text,price numeric,payload jsonb) ON CONFLICT(id) DO UPDATE SET name=excluded.name,category=excluded.category,sku=excluded.sku,price=excluded.price,payload=excluded.payload,updated_at=now(),last_sync_id=excluded.last_sync_id,is_active=true",[JSON.stringify(items),syncId]);
   processed+=chunk.length;
  }
  const reader=resp.body.getReader();
  const decoder=new TextDecoder();
  while(true){
   const {done,value}=await reader.read();if(done)break;
   parser.write(decoder.decode(value,{stream:true}));
   if(batch.length>=150)await flush();
  }
  parser.write(decoder.decode());parser.close();await flush();
  if(processed<1000)throw Error("Suspiciously small feed; not deactivating any products");
  const deactivated=await db.query("UPDATE store_products SET is_active=false WHERE last_sync_id IS DISTINCT FROM $1::uuid AND is_active=true RETURNING id",[syncId]);
  return {skipped:false,updated:processed,deactivated:deactivated.rowCount||0,seconds:Math.round((Date.now()-start)/1000)};
 }finally{
  if(locked)await lockClient.query("SELECT pg_advisory_unlock(937421)").catch(()=>{});
  lockClient.release();await db.end();
 }
}
