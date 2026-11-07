import {NextResponse} from "next/server";
import {databaseEnabled,getCatalogFilters} from "@/lib/store-db";
export const runtime="nodejs";
export async function GET(){if(!databaseEnabled())return NextResponse.json({brands:[],count:0});try{return NextResponse.json(await getCatalogFilters(),{headers:{"Cache-Control":"public, s-maxage=300, stale-while-revalidate=600"}})}catch{return NextResponse.json({brands:[],count:0},{status:503})}}
