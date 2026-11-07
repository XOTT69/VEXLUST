import sax from "sax";
import {Pool} from "pg";
import {normalize,type Raw} from "../src/lib/supplier";
if(!process.env.DATABASE_URL)throw Error("DATABASE_URL is required");
const FEED="https://smtm.com.ua/_prices/import-retail-ua-2.xml";
const db=new Pool({connectionString:process.env.DATABASE_URL,max:3,ssl:process.env.DATABASE_URL.includes("localhost")?false:{rejectUnauthorized:false}});
const response=await fetch(FEED,{signal:AbortSignal.timeout(240000),headers:{"Accept":"application/xml,text/xml"}});
if(!response.ok||!response.body)throw Error("Feed unavailable: "+response.status);
const parser=sax.parser(false,{lowercase:true,trim:true});
const stack:string[]=[];let current:Raw|null=null;let depth=-1;let paramName="";let batch:ReturnType<typeof normalize>[]=[];let processed=0;
const clean=(s:string)=>s.replace(/<[^>]*>/g," ").trim();
parser.onopentag=node=>{const tag=node.name.toLowerCase();stack.push(tag);if(current&&tag==="param")paramName=String(node.attributes["name"]||node.attributes["NAME"]||"").slice(0,100);if(["offer","product","item","товар"].includes(tag)&&!current){const attrs:Record<string,string>={};for(const [k,v] of Object.entries(node.attributes))attrs[k.toLowerCase()]=String(v);current={attrs,data:{},images:[],specs:{}};depth=stack.length}};
parser.ontext=text=>{if(!current||stack.length<=depth)return;const tag=stack[stack.length-1];const old=current.data[tag]||"";if(old.length<5000)current.data[tag]=(old+text).slice(0,5000)};
parser.oncdata=text=>{if(!current||stack.length<=depth)return;const tag=stack[stack.length-1];const old=current.data[tag]||"";if(old.length<5000)current.data[tag]=(old+text).slice(0,5000)};
parser.onclosetag=name=>{const tag=name.toLowerCase();if(current&&tag==="param"&&paramName){const value=clean(current.data.param||"");if(value)current.specs[paramName]=value.slice(0,300);delete current.data.param;paramName=""}if(current&&["picture","image","photo","img"].includes(tag)&&stack.length>depth){const url=current.data[tag]?.trim();if(url)current.images.push(url);delete current.data[tag]}if(current&&stack.length===depth&&["offer","product","item","товар"].includes(tag)){const p=normalize(current);if(p)batch.push(p);current=null;depth=-1}stack.pop()};
async function flush(){
 if(!batch.length)return;
 const chunk=batch.filter((p):p is NonNullable<typeof p>=>p!==null);
 batch=[];
 const items=chunk.map(p=>({id:p.id,name:p.name,category:p.category,sku:p.sku||"",price:p.price,payload:p}));
 await db.query(
  "INSERT INTO store_products(id,name,category,sku,price,payload,updated_at) SELECT id,name,category,sku,price,payload,now() FROM jsonb_to_recordset($1::jsonb) AS item(id text,name text,category text,sku text,price numeric,payload jsonb) ON CONFLICT(id) DO UPDATE SET name=excluded.name,category=excluded.category,sku=excluded.sku,price=excluded.price,payload=excluded.payload,updated_at=now()",
  [JSON.stringify(items)]
 );
 processed+=chunk.length;
 if(processed%1000<chunk.length)console.log("Imported",processed);
}
try{await db.query("SELECT id FROM store_products LIMIT 1");const reader=response.body.getReader();const decoder=new TextDecoder();while(true){const {done,value}=await reader.read();if(done)break;parser.write(decoder.decode(value,{stream:true}));if(batch.length>=150)await flush()}parser.write(decoder.decode());parser.close();await flush();console.log("Import complete:",processed)}finally{await db.end()}
