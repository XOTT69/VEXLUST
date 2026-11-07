/**
 * Safely initializes the connected Neon database on first production build.
 * Subsequent builds skip large supplier imports if products already exist.
 */
import {readFile} from "node:fs/promises";
import {Pool} from "pg";
const connectionString=process.env.DATABASE_URL_UNPOOLED||process.env.DATABASE_URL;
if(!connectionString){
 console.log("No DATABASE_URL at build time; skipping database bootstrap.");
}else{
 const db=new Pool({connectionString,max:1,connectionTimeoutMillis:12000,ssl:connectionString.includes("localhost")?false:{rejectUnauthorized:false}});
 try{
  await db.query(await readFile("db/001_store_products.sql","utf8"));
  const result=await db.query("SELECT count(*)::int AS count FROM store_products");
  const count=Number(result.rows[0].count);
  console.log("Neon database connected. Existing catalog size:",count);
  await db.end();
  if(count===0){
   console.log("First initialization: importing complete SexOpt product feed.");
   await import("./import-sexopt");
  }else console.log("Catalog already present; skipping import during build.");
 }catch(error){
  await db.end().catch(()=>{});
  throw error;
 }
}
