import {Pool} from "pg";
import type {Product} from "@/lib/catalog";
let pool:Pool|undefined;
export const databaseEnabled=()=>!!process.env.DATABASE_URL;
function getPool(){if(!process.env.DATABASE_URL)throw Error("Database not configured");if(!pool)pool=new Pool({connectionString:process.env.DATABASE_URL,max:3,connectionTimeoutMillis:6000,ssl:process.env.DATABASE_URL.includes("localhost")?false:{rejectUnauthorized:false}});return pool}
export type SearchQuery={page:number;limit:number;q:string;category:string;sort:string};
export async function findProducts(query:SearchQuery):Promise<{products:Product[];total:number}>{
 const db=getPool();
 const conditions:string[]=[];const args:unknown[]=[];
 if(query.q){args.push("%"+query.q+"%");conditions.push("(name ILIKE $"+args.length+" OR sku ILIKE $"+args.length+")")}
 if(query.category&&query.category!=="Усі"){args.push(query.category);conditions.push("category=$"+args.length)}
 const where=conditions.length?"WHERE "+conditions.join(" AND "):"";
 const allowed:Record<string,string>={new:"updated_at DESC",price_asc:"price ASC",price_desc:"price DESC",name:"name ASC"};
 const order=allowed[query.sort]||"name ASC";
 const total=Number((await db.query("SELECT count(*)::integer AS count FROM store_products "+where,args)).rows[0]?.count||0);
 const values=[...args,query.limit,(query.page-1)*query.limit];
 const rows=await db.query("SELECT payload FROM store_products "+where+" ORDER BY "+order+" LIMIT $"+(args.length+1)+" OFFSET $"+(args.length+2),values);
 return {products:rows.rows.map(r=>r.payload as Product),total};
}
export async function findProductById(id:string):Promise<{product:Product|null;related:Product[]}>{
 const db=getPool();const result=await db.query("SELECT payload,category FROM store_products WHERE id=$1",[id]);if(!result.rowCount)return {product:null,related:[]};
 const product=result.rows[0].payload as Product;
 const related=await db.query("SELECT payload FROM store_products WHERE category=$1 AND id<>$2 ORDER BY updated_at DESC LIMIT 4",[result.rows[0].category,id]);
 return {product,related:related.rows.map(r=>r.payload as Product)};
}
