import "./globals.css";
import type { Metadata } from "next";
export const metadata:Metadata={title:"VEXLUST — простір близькості",description:"Демонстраційний магазин інтимного добробуту 18+",robots:{index:false,follow:false}};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="uk"><body>{children}</body></html>}