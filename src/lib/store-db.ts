import {Pool} from "pg";
import type {Product} from "@/lib/catalog";
import {types,kindOf,rankSimilar} from "@/lib/taxonomy";
let pool:Pool|undefined;
export const databaseEnabled=()=>!!process.env.DATABASE_URL;
function getPool(){if(!process.env.DATABASE_URL)throw Error("Database not configured");if(!pool)pool=new Pool({connectionString:process.env.DATABASE_URL,max:3,connectionTimeoutMillis:6000,ssl:process.env.DATABASE_URL.includes("localhost")?false:{rejectUnauthorized:false}});return pool}
export type SearchQuery={page:number;limit:number;q:string;category:string;sort:string};
export async function findProducts(query:SearchQuery):Promise<{products:Product[];total:number}>{
 const db=getPool();
 const conditions:string[]=[];const args:unknown[]=[];
 if(query.q){args.push("%"+query.q+"%");conditions.push("(name ILIKE $"+args.length+" OR sku ILIKE $"+args.length+")")}
 if(query.category&&query.category!=="Усі"){const taxon=types.find(t=>t.label===query.category);args.push(taxon?taxon.sql:query.category);conditions.push(taxon?"name ~* $"+args.length:"category=$"+args.length)}
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
 const family=kindOf(product);
 if(family==="Інше")return {product,related:[]};
 const taxon=types.find(t=>t.label===family);
 if(!taxon)return {product,related:[]};
 // Only rank products of the *same actual product family*, not an entire broad group.
 const candidates=await db.query("SELECT payload FROM store_products WHERE id<>$1 AND (name ~* $2 OR category=$3) LIMIT 1000",[id,taxon.sql,product.category]);
 return {product,related:rankSimilar(product,candidates.rows.map(r=>r.payload as Product),6)};
}

export async function findProductsByIds(ids:string[]):Promise<Product[]>{
 if(!ids.length)return [];
 const results=await getPool().query("SELECT payload FROM store_products WHERE id=ANY($1::text[])",[ids]);
 const mapped=new Map<string,Product>(results.rows.map(row=>{const p=row.payload as Product;return [p.id,p]}));
 return ids.flatMap(id=>mapped.has(id)?[mapped.get(id)!]:[]);
}
