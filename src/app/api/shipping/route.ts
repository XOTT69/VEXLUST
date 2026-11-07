import {NextRequest,NextResponse} from "next/server";
import {npRequest,type NPCity,type NPWarehouse} from "@/lib/nova-poshta";
export const runtime="nodejs";export const maxDuration=15;
export async function GET(request:NextRequest){
 if(!process.env.NOVAPOSHTA_API_KEY)return NextResponse.json({configured:false,cities:[],warehouses:[],message:"Для доступу до Нової пошти необхідний серверний API-ключ."});
 const sp=request.nextUrl.searchParams;
 const type=sp.get("type");
 try{
  if(type==="cities"){
   const search=(sp.get("q")||"").trim().slice(0,70);
   if(search.length<2)return NextResponse.json({configured:true,cities:[]});
   const cities=await npRequest<NPCity>("Address","getCities",{FindByString:search,Page:1,Limit:30});
   return NextResponse.json({configured:true,cities:cities.slice(0,30).map(c=>({ref:c.Ref,name:c.Description,area:c.AreaDescription||""}))},{headers:{"Cache-Control":"public, s-maxage=120"}});
  }
  if(type==="warehouses"){
   const cityRef=sp.get("cityRef")||"";
   if(!/^[a-f0-9-]{36}$/i.test(cityRef))return NextResponse.json({error:"Invalid city reference"},{status:400});
   const page=Number(sp.get("page")||"1");
   if(!Number.isInteger(page)||page<1||page>100)return NextResponse.json({error:"Invalid page"},{status:400});
   const warehouses=await npRequest<NPWarehouse>("AddressGeneral","getWarehouses",{CityRef:cityRef,Page:page,Limit:100});
   return NextResponse.json({configured:true,warehouses:warehouses.map(w=>({ref:w.Ref,name:w.Description,number:w.Number||""})),page},{headers:{"Cache-Control":"public, s-maxage=120"}});
  }
  return NextResponse.json({error:"Unknown query"},{status:400});
 }catch(error){console.error("Nova Poshta lookup failed",error);return NextResponse.json({error:"Нова пошта тимчасово недоступна. Перевірте ключ і спробуйте знову."},{status:502})}
}
