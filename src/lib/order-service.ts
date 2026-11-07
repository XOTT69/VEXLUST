import {Pool} from "pg";
import {randomUUID} from "node:crypto";
import {findProductsByIds} from "@/lib/store-db";
import type {Product} from "@/lib/catalog";
let pool:Pool|undefined;
function db(){
 const connectionString=process.env.DATABASE_URL;
 if(!connectionString)throw Error("Database not configured");
 if(!pool)pool=new Pool({connectionString,max:2,ssl:connectionString.includes("localhost")?false:{rejectUnauthorized:false},connectionTimeoutMillis:5000});
 return pool;
}
export function ordersEnabled(){
 // All conditions must be explicitly satisfied, not merely the presence of an API key.
 return process.env.ENABLE_LIVE_CHECKOUT==="true"&&process.env.SELLER_REGISTERED==="true"&&
 process.env.PRRO_CONNECTED==="true"&&process.env.SUPPLIER_FULFILLMENT_READY==="true"&&
 process.env.SUPPLIER_STOCK_SYNC_READY==="true";
}
type RequestItem={id:string;qty:number};
export type NewOrder={items:RequestItem[];contactName:string;contactPhone:string;cityRef:string;warehouseRef:string;cityName:string;warehouseName:string;idempotencyKey:string};
export async function submitOrder(user:{id:string;email:string},payload:NewOrder){
 const conn=db();
 const unique=new Set(payload.items.map(i=>i.id));
 if(unique.size!==payload.items.length)throw Error("Duplicate item IDs");
 const ids=[...unique];
 const found=await findProductsByIds(ids);
 if(found.length!==ids.length)throw Error("Some items are unavailable");
 const byId=new Map<string,Product>(found.map(p=>[p.id,p]));
 let total=0;
 const items=payload.items.map(i=>{
  const p=byId.get(i.id)!;
  if(!Number.isFinite(p.price)||p.price<=0)throw Error("Invalid supplier price");
  const unitKopecks=Math.round(p.price*100);
  total+=unitKopecks*i.qty;
  return {id:p.id,sku:p.sku||"",title:p.name,quantity:i.qty,unitKopecks};
 });
 if(total<1||total>25_000_000)throw Error("Order exceeds allowable amount");
 // Require recent import before accepting any commercial order.
 const freshness=await conn.query("SELECT MAX(updated_at) AS last_sync FROM store_products");
 const last=Number(new Date(freshness.rows[0]?.last_sync||0));
 if(!last||Date.now()-last>2*60*60*1000)throw Error("Supplier data is too old; checkout disabled");
 const existing=await conn.query("SELECT id,status,total_kopecks FROM store_order_requests WHERE user_id=$1 AND idempotency_key=$2",[user.id,payload.idempotencyKey]);
 if(existing.rows.length)return {id:existing.rows[0].id,status:existing.rows[0].status,totalKopecks:Number(existing.rows[0].total_kopecks),replayed:true};
 const result=await conn.query(
  "INSERT INTO store_order_requests(user_id,idempotency_key,contact_name,contact_email,contact_phone,city_ref,warehouse_ref,city_name,warehouse_name,items,total_kopecks) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10::jsonb,$11) ON CONFLICT(user_id,idempotency_key) DO UPDATE SET idempotency_key=excluded.idempotency_key RETURNING id,status,total_kopecks",
  [user.id,payload.idempotencyKey,payload.contactName,user.email,payload.contactPhone,payload.cityRef,payload.warehouseRef,payload.cityName,payload.warehouseName,JSON.stringify(items),total]
 );
 return {id:result.rows[0].id,status:result.rows[0].status,totalKopecks:Number(result.rows[0].total_kopecks),replayed:false};
}
export async function listOrders(userId:string){
 const result=await db().query("SELECT id,status,total_kopecks,city_name,warehouse_name,created_at FROM store_order_requests WHERE user_id=$1 ORDER BY created_at DESC LIMIT 30",[userId]);
 return result.rows.map(x=>({id:x.id,status:x.status,totalKopecks:Number(x.total_kopecks),city:x.city_name,warehouse:x.warehouse_name,createdAt:x.created_at}));
}
