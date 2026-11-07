import {NextRequest,NextResponse} from "next/server";
import {databaseEnabled,findProductsByIds} from "@/lib/store-db";
import {getSupplierProducts} from "@/lib/supplier";
export const runtime="nodejs";
export async function GET(req:NextRequest){
 const ids=(req.nextUrl.searchParams.get("ids")||"").split(",").filter(s=>/^sexopt-[a-z0-9_-]{1,100}$/i.test(s)).slice(0,50);
 if(!ids.length)return NextResponse.json({products:[]});
 try{
  const products=databaseEnabled()?await findProductsByIds(ids):(await getSupplierProducts()).filter(p=>ids.includes(p.id));
  return NextResponse.json({products},{headers:{"Cache-Control":"private,no-store"}});
 }catch{return NextResponse.json({error:"Товари тимчасово недоступні",products:[]},{status:503})}
}
