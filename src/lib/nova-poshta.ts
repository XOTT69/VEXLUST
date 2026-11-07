type NPResult<T>={success:boolean;data:T[];errors?:string[]};
export type NPCity={Ref:string;Description:string;AreaDescription?:string};
export type NPWarehouse={Ref:string;Description:string;Number?:string;CityDescription?:string};
export async function npRequest<T>(modelName:"Address"|"AddressGeneral",calledMethod:"getCities"|"getWarehouses",methodProperties:Record<string,string|number>):Promise<T[]>{
 const apiKey=process.env.NOVAPOSHTA_API_KEY;
 if(!apiKey)throw Error("NOVAPOSHTA_API_KEY is not configured");
 const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),9000);
 try{
  const response=await fetch("https://api.novaposhta.ua/v2.0/json/",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({apiKey,modelName,calledMethod,methodProperties}),signal:controller.signal,cache:"no-store"});
  if(!response.ok)throw Error("Nova Poshta HTTP "+response.status);
  const json=await response.json() as NPResult<T>;
  if(!json.success||!Array.isArray(json.data))throw Error("Nova Poshta declined request: "+(json.errors||[]).join(", ").slice(0,250));
  return json.data;
 }finally{clearTimeout(timeout)}
}
