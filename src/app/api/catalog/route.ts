import {NextRequest,NextResponse} from "next/server";
import {getSupplierProducts} from "@/lib/supplier";
import {databaseEnabled,findProducts} from "@/lib/store-db";
import {types} from "@/lib/taxonomy";
export const runtime="nodejs";
export const maxDuration=30;
const clamp=(value:string|null,def:number,max:number)=>{const n=Number(value);return Number.isSafeInteger(n)&&n>0?Math.min(n,max):def};
export async function GET(request:NextRequest){
 const sp=request.nextUrl.searchParams;
 const page=clamp(sp.get("page"),1,100000),limit=clamp(sp.get("limit"),24,48);
 const q=(sp.get("q")||"").trim().slice(0,100),category=(sp.get("category")||"Усі").slice(0,70),sort=(sp.get("sort")||"new").slice(0,30),brand=(sp.get("brand")||"").slice(0,90);
 const parsePrice=(v:string|null)=>{if(!v||!/^\d{1,7}(\.\d{1,2})?$/.test(v))return undefined;const n=Number(v);return Number.isFinite(n)?n:undefined};
 const minPrice=parsePrice(sp.get("minPrice")),maxPrice=parsePrice(sp.get("maxPrice"));
 try{
  if(databaseEnabled()){
   const {products,total}=await findProducts({page,limit,q,category,sort,brand,minPrice,maxPrice});
   return NextResponse.json({mode:"database",checkoutEnabled:false,products,total,page,pages:Math.ceil(total/limit)},{headers:{"Cache-Control":"public, s-maxage=90, stale-while-revalidate=180"}});
  }
  const all=await getSupplierProducts();
  const sub=types.find(t=>t.label===category);
  const filtered=all.filter(p=>(category==="Усі"||(sub?sub.regex.test(p.name):p.category===category))&&(!q||(p.name+" "+p.description+" "+(p.sku||"")).toLowerCase().includes(q.toLowerCase()))&&(!brand||p.brand?.toLowerCase()===brand.toLowerCase())&&(minPrice===undefined||p.price>=minPrice)&&(maxPrice===undefined||p.price<=maxPrice));
  if(sort==="price_asc")filtered.sort((a,b)=>a.price-b.price);
  else if(sort==="price_desc")filtered.sort((a,b)=>b.price-a.price);
  else if(sort==="name")filtered.sort((a,b)=>a.name.localeCompare(b.name,"uk"));
  const products=filtered.slice((page-1)*limit,page*limit);
  return NextResponse.json({mode:"supplier-preview",checkoutEnabled:false,products,total:filtered.length,page,pages:Math.ceil(filtered.length/limit),notice:"Preview only. Full catalog requires DATABASE_URL and background import."},{headers:{"Cache-Control":"public, s-maxage=180, stale-while-revalidate=600"}});
 }catch(error){console.error("Catalog error",error);return NextResponse.json({mode:"unavailable",checkoutEnabled:false,products:[],message:"Catalog unavailable"},{status:503,headers:{"Cache-Control":"no-store"}})}
}
