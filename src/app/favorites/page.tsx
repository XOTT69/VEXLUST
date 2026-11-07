"use client";
import Link from "next/link";
import {useEffect,useState} from "react";
import {ArrowLeft,Heart,ShoppingBag} from "lucide-react";
import type {Product} from "@/lib/catalog";
import {money} from "@/lib/catalog";
import {readFavorites,toggleFavorite,addToCart} from "@/lib/cart";
export default function Favorites(){
 const [products,setProducts]=useState<Product[]>([]),[loading,setLoading]=useState(true),[count,setCount]=useState(0);
 useEffect(()=>{const ids=readFavorites();setCount(ids.length);if(!ids.length){setLoading(false);return}fetch("/api/favorites?ids="+encodeURIComponent(ids.join(","))).then(async r=>{if(!r.ok)throw Error();return r.json()}).then(data=>{setProducts(data.products||[])}).catch(()=>{}).finally(()=>setLoading(false))},[]);
 function remove(id:string){toggleFavorite(id);setProducts(old=>old.filter(p=>p.id!==id));setCount(old=>old-1)}
 return <main className="customer-page"><header className="customer-header"><Link href="/" className="brand">VEX<span>LUST</span><i>✦</i></Link><Link href="/#catalog"><ArrowLeft size={16}/> Каталог</Link></header><div className="account-wrap"><span className="eyebrow">SAVED WITH LOVE</span><h1>Обране <small>({count})</small></h1><p>Товари збережено на цьому пристрої. Після авторизації синхронізацію між пристроями додамо окремо.</p>{loading?<p>Завантажуємо обране…</p>:!products.length?<div className="customer-panel"><Heart size={37}/><h2>Тут поки порожньо</h2><p>Натискай сердечко біля товарів, щоб зберігати їх тут.</p><Link href="/#catalog" className="primary">Переглянути каталог</Link></div>:<div className="favorite-grid">{products.map(p=><article key={p.id} className="favorite-product"><Link href={"/product/"+encodeURIComponent(p.id)}>{p.image?<img src={p.image} alt={p.name} loading="lazy"/>:<div className="favorite-no-photo"><ShoppingBag/></div>}</Link><p className="category">{p.category}</p><Link href={"/product/"+encodeURIComponent(p.id)}><strong>{p.name}</strong></Link><b>{money(p.price)}</b><div><button onClick={()=>addToCart(p)} className="primary"><ShoppingBag size={16}/> У кошик</button><button onClick={()=>remove(p.id)} aria-label="Прибрати з обраного" className="favorite-remove"><Heart size={18} fill="currentColor"/></button></div></article>)}</div>}</div></main>
}
