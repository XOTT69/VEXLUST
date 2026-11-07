export type Product={id:string;name:string;category:string;price:number;color:string;description:string;badge?:string;image?:string;images?:string[]};
export const categories=["Усі","Для неї","Для нього","Для двох","Догляд","Аксесуари"];
/** Fallback examples are NOT displayed as actual supplier products. */
export const products:Product[]=[];
export function money(n:number){return new Intl.NumberFormat("uk-UA",{style:"currency",currency:"UAH",maximumFractionDigits:0}).format(n)}
