import {NextRequest,NextResponse} from "next/server";
import {databaseEnabled,findProductById} from "@/lib/store-db";
import {getSupplierProducts} from "@/lib/supplier";
export const runtime="nodejs";export const maxDuration=30;
export async function GET(_request:NextRequest,{params}:{params:Promise<{id:string}>}){
 const {id}=await params;
 if(!id||id.length>120)return NextResponse.json({error:"Invalid product ID"},{status:400});
 try{
  let product=null,related=[];
  if(databaseEnabled())({product,related}=await findProductById(id));
  else{const all=await getSupplierProducts();product=all.find(p=>p.id===id)||null;related=product?all.filter(p=>p.id!==id&&p.category===product!.category).slice(0,4):[]}
  if(!product)return NextResponse.json({error:"Not found"},{status:404});
  return NextResponse.json({product,related,checkoutEnabled:false},{headers:{"Cache-Control":"public, s-maxage=180, stale-while-revalidate=600"}});
 }catch(error){console.error("Product load failed",error);return NextResponse.json({error:"Product unavailable"},{status:503})}
}
