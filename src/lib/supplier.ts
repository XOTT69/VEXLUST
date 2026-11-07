import sax from "sax";
import type {Product} from "./catalog";

const FEED_URL="https://smtm.com.ua/_prices/import-retail-ua-2.xml";
const LIMIT=240;
type Raw={attrs:Record<string,string>;data:Record<string,string>;images:string[]};
const clean=(value:string)=>value.replace(/<[^>]*>/g," ").replace(/\s+/g," ").trim();
function select(obj:Record<string,string>,...keys:string[]){
 for(const key of keys)if(obj[key.toLowerCase()])return obj[key.toLowerCase()];
 return "";
}
function normalize(raw:Raw):Product|null{
 const row=raw.data,attr=raw.attrs;
 const id=select(attr,"id","sku","code")||select(row,"id","vendorcode","article","articul","артикул","код","sku");
 const name=clean(select(row,"name","title","назва","наименование","product_name")).slice(0,220);
 const priceValue=select(row,"price","priceruah","retail_price","ціна","price_retail","priceuah").replace(/\s/g,"").replace(",",".");
 const price=Number(priceValue);
 if(!id||!name||!Number.isFinite(price)||price<=0||price>1000000)return null;
 const available=(select(attr,"available")||select(row,"available","in_stock","stock","presence","наявність","quantity")).toLowerCase();
 if(["false","0","no","нет","немає","відсутній"].includes(available))return null;
 const categoryText=(select(row,"category","categoryname","category_id","categoryid","категорія")+" "+name).toLowerCase();
 let category="Аксесуари";
 if(/космет|догляд|лубрикан|змазк|мастил|масажн.*ол/.test(categoryText))category="Догляд";
 else if(/для двох|для пар|парн|набор|комплект/.test(categoryText))category="Для двох";
 else if(/чолов|мужчин|простата/.test(categoryText))category="Для нього";
 else if(/жіноч|женщин|вібратор/.test(categoryText))category="Для неї";
 const rawImage=raw.images[0]||select(row,"picture","image","image_url","photo","img");
 let image:string|undefined;
 try{const u=new URL(rawImage);if(["https:","http:"].includes(u.protocol))image=u.href}catch{}
 const description=clean(select(row,"description","опис","desc")).slice(0,300);
 return {id:"sexopt-"+id,name,price:Math.round(price*100)/100,category,color:"#efe0e5",image,description:description||"Опис постачальника"};
}
/** Read only the start of the 76MB feed; never buffer or cache the complete XML. */
export async function getSupplierProducts():Promise<Product[]>{
 const response=await fetch(FEED_URL,{cache:"no-store",signal:AbortSignal.timeout(25000),headers:{"Accept":"application/xml,text/xml,*/*"}});
 if(!response.ok||!response.body)throw Error("Supplier HTTP "+response.status);
 const reader=response.body.getReader();
 const decoder=new TextDecoder();
 const parser=sax.parser(false,{trim:true,normalize:false,lowercase:true,xmlns:false});
 const products:Product[]=[];
 const seen=new Set<string>();
 const stack:string[]=[];
 let current:Raw|null=null;
 let targetDepth=-1;
 let bytes=0;
 let streamError:Error|null=null;
 parser.onerror=(err)=>{streamError=err;};
 parser.onopentag=(node)=>{
   const tag=node.name.toLowerCase();
   stack.push(tag);
   if((tag==="offer"||tag==="product"||tag==="item"||tag==="товар")&&current===null){
     const attrs:Record<string,string>={};
     for(const [key,value] of Object.entries(node.attributes))attrs[key.toLowerCase()]=String(value);
     current={attrs,data:{},images:[]};
     targetDepth=stack.length;
   }
 };
 parser.ontext=(text)=>{if(!current||stack.length<=targetDepth)return;const field=stack[stack.length-1];const previous=current.data[field]||"";if(previous.length<600)current.data[field]=(previous+text).slice(0,600);};
 parser.oncdata=(text)=>{if(!current||stack.length<=targetDepth)return;const field=stack[stack.length-1];const previous=current.data[field]||"";if(previous.length<600)current.data[field]=(previous+text).slice(0,600);};
 parser.onclosetag=(name)=>{
   const tag=name.toLowerCase();
   if(current&&["picture","image","photo","img"].includes(tag)&&stack.length>targetDepth){
      const url=current.data[tag]?.trim();
      if(url)current.images.push(url);
      delete current.data[tag];
   }
   if(current&&stack.length===targetDepth&&["offer","product","item","товар"].includes(tag)){
     const product=normalize(current);
     if(product&&!seen.has(product.id)){seen.add(product.id);products.push(product)}
     current=null;targetDepth=-1;
   }
   stack.pop();
 };
 try{
  while(products.length<LIMIT&&bytes<25_000_000){
   const {done,value}=await reader.read();
   if(done)break;
   bytes+=value.byteLength;
   parser.write(decoder.decode(value,{stream:true}));
   if(streamError)throw streamError;
  }
 }finally{await reader.cancel().catch(()=>{});}
 if(products.length===0)throw Error("No valid product records in XML start, bytes read: "+bytes);

 return products;
}
