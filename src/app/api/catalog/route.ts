import {NextResponse} from "next/server";
import {products} from "@/lib/catalog";
export function GET(){return NextResponse.json({mode:"demo",currency:"UAH",products},{headers:{"Cache-Control":"public, max-age=60"}})}
