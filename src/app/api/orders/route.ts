import {NextRequest,NextResponse} from "next/server";
import {auth} from "@/lib/auth/server";
import {ordersEnabled,submitOrder,listOrders} from "@/lib/order-service";
import {z} from "zod";
export const runtime="nodejs";
const phone=/^\+?380\d{9}$/;
const uuid=z.string().uuid();
const schema=z.object({
 items:z.array(z.object({id:z.string().regex(/^sexopt-[a-z0-9_-]{1,100}$/i),qty:z.number().int().min(1).max(10)})).min(1).max(25),
 contactName:z.string().trim().min(2).max(90),
 contactPhone:z.string().regex(phone),
 cityRef:uuid,warehouseRef:uuid,
 cityName:z.string().trim().min(2).max(100),
 warehouseName:z.string().trim().min(2).max(240),
 idempotencyKey:uuid
}).strict();
async function getUser(){
 const r=await auth.getSession() as unknown as {user?:{id:string;email?:string},data?:{user?:{id:string;email?:string}}};
 const user=r.user||r.data?.user;
 return user?.id&&user.email?{id:user.id,email:user.email}:null;
}
export async function GET(){
 if(!ordersEnabled())return NextResponse.json({orders:[],acceptingOrders:false},{headers:{"Cache-Control":"no-store"}});
 const user=await getUser();if(!user)return NextResponse.json({error:"Sign in required"},{status:401});
 try{return NextResponse.json({orders:await listOrders(user.id),acceptingOrders:true},{headers:{"Cache-Control":"private,no-store"}})}
 catch{return NextResponse.json({error:"Orders unavailable"},{status:503})}
}
export async function POST(req:NextRequest){
 if(!ordersEnabled())return NextResponse.json({error:"Оформлення замовлень поки вимкнене. Доступні тільки локальні чернетки."},{status:403,headers:{"Cache-Control":"no-store"}});
 const user=await getUser();if(!user)return NextResponse.json({error:"Спочатку увійдіть до акаунта."},{status:401});
 if(Number(req.headers.get("content-length")||"0")>12_000)return NextResponse.json({error:"Request too large"},{status:413});
 try{
  const payload=schema.safeParse(await req.json());
  if(!payload.success)return NextResponse.json({error:"Помилка перевірки даних замовлення"},{status:400});
  const order=await submitOrder(user,payload.data);
  return NextResponse.json({order,message:"Отримано заявку на підтвердження. Оплата не здійснювалась."},{status:202,headers:{"Cache-Control":"no-store"}});
 }catch(error){console.error("Order request failed",error);return NextResponse.json({error:"Не вдалося сформувати замовлення. Перевірте наявність і спробуйте знову."},{status:503})}
}
