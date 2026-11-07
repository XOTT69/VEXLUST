import {XMLParser} from "fast-xml-parser";
import type {Product} from "./catalog";
const FEED_URL="https://smtm.com.ua/_prices/import-retail-ua-2.xml";
type AnyRow=Record<string,unknown>;
const pick=(v:unknown):string=>{
 if(v===null||v===undefined)return "";
 if(typeof v==="string"||typeof v==="number")return String(v).trim();
 if(Array.isArray(v))return pick(v[0]);
 if(typeof v==="object"){const o=v as AnyRow;return pick(o["#text"]??o["__cdata"]??o["@_url"]??o["url"]??"")}
 return "";
};
function field(row:AnyRow,...keys:string[]):unknown{
 for(const key of keys){if(row[key]!==undefined)return row[key];const real=Object.keys(row).find(k=>k.toLowerCase()===key.toLowerCase());if(real)return row[real]}
 return undefined;
}
function traverse(node:unknown,depth=0):AnyRow[]{
 if(depth>8||node===null||typeof node!=="object")return [];
 if(Array.isArray(node)){if(node.length&&node.some(i=>i&&typeof i==="object"&&("name" in i||"title" in i||"Назва" in i)))return node as AnyRow[];return node.flatMap(item=>traverse(item,depth+1))}
 const obj=node as AnyRow;
 for(const key of ["offer","offers","product","products","item","items","товар","товари"]){
  const target=field(obj,key);
  if(target){const found=traverse(target,depth+1);if(found.length)return found}
 }
 if(field(obj,"name","title","назва")&&field(obj,"price","ціна","priceRUAH"))return [obj];
 return Object.values(obj).flatMap(value=>traverse(value,depth+1)).slice(0,10000);
}
function safeImage(v:unknown):string|undefined{
 let raw=pick(v);
 if(!raw&&typeof v==="object"&&v!==null){const o=v as AnyRow;raw=pick(field(o,"picture","image","img","url","src"))}
 try{const url=new URL(raw);return url.protocol==="https:"||url.protocol==="http:"?url.href:undefined}catch{return undefined}
}
function normalized(row:AnyRow):Product|null{
 const id=pick(field(row,"@_id","id","vendorCode","sku","article","articul","артикул","код"));
 const name=pick(field(row,"name","title","назва","Наименование","product_name"));
 const rawPrice=pick(field(row,"price","priceRUAH","retail_price","ціна","price_retail","priceUAH")).replace(/\s/g,"").replace(",",".");
 const price=Number(rawPrice);
 if(!id||!name||name.length>200||!Number.isFinite(price)||price<=0||price>1000000)return null;
 const stock=pick(field(row,"available","@_available","stock","in_stock","presence","наявність","quantity")).toLowerCase();
 if(["false","0","no","нет","немає","відсутній"].includes(stock))return null;
 const description=pick(field(row,"description","опис","desc")).replace(/<[^>]*>/g," ").replace(/\s+/g," ").slice(0,350);
 const categorySource=pick(field(row,"category","categoryName","category_id","categoryId","категорія")).toLowerCase();
 let category="Аксесуари";
 if(/космет|догляд|лубрикан|змазк|масажн.*ол/.test(categorySource+" "+name.toLowerCase()))category="Догляд";
 else if(/для двох|пар|набор|комплект/.test(categorySource+" "+name.toLowerCase()))category="Для двох";
 else if(/чолов|мужчин|простата/.test(categorySource+" "+name.toLowerCase()))category="Для нього";
 else if(/жіноч|женщин|вібратор/.test(categorySource+" "+name.toLowerCase()))category="Для неї";
 const image=safeImage(field(row,"picture","image","image_url","photo","img","фото","pictures"));
 return {id:"sexopt-"+id,name,category,price:Math.round(price*100)/100,color:"#f0e2e6",description:description||"Інформація від постачальника",image};
}
export async function getSupplierProducts():Promise<Product[]>{
 const response=await fetch(FEED_URL,{next:{revalidate:7200},signal:AbortSignal.timeout(20000),headers:{"Accept":"application/xml,text/xml,*/*"}});
 if(!response.ok)throw new Error("Supplier HTTP "+response.status);
 const len=Number(response.headers.get("content-length")||0);
 if(len>40_000_000)throw new Error("Feed size exceeds 40 MB");
 const xml=await response.text();
 if(xml.length>40_000_000)throw new Error("Feed exceeds 40 MB");
 const parser=new XMLParser({ignoreAttributes:false,parseTagValue:false,processEntities:false,trimValues:true});
 const root=parser.parse(xml);
 const candidates=traverse(root);
 const unique=new Map<string,Product>();
 for(const row of candidates){const product=normalized(row);if(product&&!unique.has(product.id))unique.set(product.id,product);if(unique.size>=300)break}
 if(unique.size===0)throw new Error("No compatible catalog entries in supplier XML");
 return [...unique.values()];
}
