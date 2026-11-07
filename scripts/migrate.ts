import fs from "node:fs/promises";
import {Pool} from "pg";
if(!(process.env.DATABASE_URL_UNPOOLED||process.env.DATABASE_URL))throw Error("Set DATABASE_URL in the environment");
const pool=new Pool({connectionString:process.env.DATABASE_URL,ssl:(process.env.DATABASE_URL_UNPOOLED||process.env.DATABASE_URL||"").includes("localhost")?false:{rejectUnauthorized:false}});
try{for(const file of ["db/001_store_products.sql","db/002_order_requests.sql","db/003_inventory_sync.sql"]){await pool.query(await fs.readFile(file,"utf8"))}console.log("Migration applied")}finally{await pool.end()}
