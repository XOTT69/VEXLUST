import type {Product} from "./catalog";
export type CartItems=Record<string,Product>;
export type CartQuantities=Record<string,number>;
export function readCart():{quantities:CartQuantities;items:CartItems}{
 if(typeof window==="undefined")return {quantities:{},items:{}};
 try{
  const q=JSON.parse(localStorage.getItem("vexlust-cart")||"{}");
  const p=JSON.parse(localStorage.getItem("vexlust-cart-items")||"{}");
  const quantities:CartQuantities={};const items:CartItems={};
  if(q&&typeof q==="object"&&!Array.isArray(q)&&p&&typeof p==="object"&&!Array.isArray(p)){
   for(const [id,value] of Object.entries(q)){const n=Number(value);const product=p[id] as Product|undefined;if(/^[a-zA-Z0-9_-]{1,120}$/.test(id)&&Number.isInteger(n)&&n>0&&n<=50&&product?.id===id){quantities[id]=n;items[id]=product}}
  }
  return {quantities,items};
 }catch{return {quantities:{},items:{}}}
}
export function saveCart(q:CartQuantities,p:CartItems){
 localStorage.setItem("vexlust-cart",JSON.stringify(q));
 localStorage.setItem("vexlust-cart-items",JSON.stringify(p));
 window.dispatchEvent(new Event("vexlust-cart-updated"));
}
export function addToCart(product:Product,qty=1){
 const {quantities,items}=readCart();
 quantities[product.id]=Math.min(50,(quantities[product.id]||0)+qty);
 items[product.id]=product;saveCart(quantities,items);
}
export function readFavorites():string[]{try{const ids=JSON.parse(localStorage.getItem("vexlust-favorites-v1")||"[]");return Array.isArray(ids)?ids.filter(x=>typeof x==="string").slice(0,200):[]}catch{return []}}
export function toggleFavorite(id:string):boolean{
 const ids=new Set(readFavorites());if(ids.has(id))ids.delete(id);else ids.add(id);
 localStorage.setItem("vexlust-favorites-v1",JSON.stringify([...ids]));
 window.dispatchEvent(new Event("vexlust-favorites-updated"));
 return ids.has(id);
}
