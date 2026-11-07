import {NextResponse} from "next/server";
import {ordersEnabled} from "@/lib/order-service";
export const runtime="nodejs";
export async function GET(){return NextResponse.json({acceptingOrders:ordersEnabled(),paymentEnabled:false,fulfillmentAutomatic:false},{headers:{"Cache-Control":"no-store"}})}
