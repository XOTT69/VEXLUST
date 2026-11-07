import {NextResponse} from "next/server";
export async function POST(){return NextResponse.json({error:"Реальні комерційні замовлення наразі вимкнені. Це тестове оформлення."},{status:403,headers:{"Cache-Control":"no-store"}})}
