export type Product={id:string;name:string;category:string;price:number;color:string;description:string;badge?:string};
export const categories=["Усі","Для неї","Для нього","Для двох","Догляд","Аксесуари"];
export const products:Product[]=[
{id:"1",name:"Silk Touch",category:"Для неї",price:1290,color:"#e6c6cf",description:"Делікатний аксесуар для комфорту",badge:"Популярне"},
{id:"2",name:"Soft Glow",category:"Для двох",price:890,color:"#dac5bc",description:"Подарунковий набір для особливих моментів",badge:"Новинка"},
{id:"3",name:"Pure Care",category:"Догляд",price:420,color:"#c8d7d1",description:"Дбайливий щоденний догляд"},
{id:"4",name:"Midnight Set",category:"Аксесуари",price:1690,color:"#bfb7c9",description:"Продуманий набір преміальних аксесуарів"},
{id:"5",name:"Velvet Mood",category:"Для нього",price:1090,color:"#d5b7b0",description:"Витончений особистий аксесуар"},
{id:"6",name:"Tender Moment",category:"Для двох",price:690,color:"#e8d1b4",description:"Аксесуари для затишної атмосфери"}
];
export function money(n:number){return new Intl.NumberFormat("uk-UA",{style:"currency",currency:"UAH",maximumFractionDigits:0}).format(n)}
