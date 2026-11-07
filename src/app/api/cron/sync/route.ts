import {NextRequest,NextResponse} from "next/server";
import {syncSupplierFeed} from "@/lib/sync-supplier";
export const runtime="nodejs";export const maxDuration=300;
export async function GET(request:NextRequest){
 const secret=process.env.CRON_SECRET;
 if(!secret||request.headers.get("authorization")!=="Bearer "+secret)return NextResponse.json({error:"Unauthorized"},{status:401});
 try{const result=await syncSupplierFeed();console.info("VEXLUST daily supplier sync",result);return NextResponse.json({ok:true,...result},{headers:{"Cache-Control":"no-store"}})}
 catch(error){console.error("VEXLUST supplier sync failed",error);return NextResponse.json({error:"Supplier sync failed"},{status:503,headers:{"Cache-Control":"no-store"}})}
}
