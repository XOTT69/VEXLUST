import {NextResponse} from "next/server";
// No real orders until legal seller, payment provider, receipts and fulfillment are ready.
export async function POST(){return NextResponse.json({error:"Реальні замовлення наразі вимкнені. Магазин у демонстраційному режимі."},{status:403,headers:{"Cache-Control":"no-store"}})}
