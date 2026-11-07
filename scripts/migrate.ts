import fs from "node:fs/promises";
import {Pool} from "pg";
if(!(process.env.DATABASE_URL_UNPOOLED||process.env.DATABASE_URL))throw Error("Set DATABASE_URL in the environment");
const pool=new Pool({connectionString:process.env.DATABASE_URL,ssl:(process.env.DATABASE_URL_UNPOOLED||process.env.DATABASE_URL||"").includes("localhost")?false:{rejectUnauthorized:false}});
try{await pool.query(await fs.readFile("db/001_store_products.sql","utf8"));console.log("Migration applied")}finally{await pool.end()}
