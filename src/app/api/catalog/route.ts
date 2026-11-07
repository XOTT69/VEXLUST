import {NextResponse} from "next/server";
import {getSupplierProducts} from "@/lib/supplier";
export const runtime="nodejs";
export const maxDuration=30;
export async function GET(){try{const products=await getSupplierProducts();return NextResponse.json({mode:"supplier-preview",supplier:"SexOpt",checkoutEnabled:false,count:products.length,products},{headers:{"Cache-Control":"public, s-maxage=3600, stale-while-revalidate=3600"}})}catch(error){console.error("Supplier catalog unavailable",error);return NextResponse.json({mode:"unavailable",products:[],checkoutEnabled:false,message:"Supplier feed unavailable"},{status:503,headers:{"Cache-Control":"no-store"}})}}
