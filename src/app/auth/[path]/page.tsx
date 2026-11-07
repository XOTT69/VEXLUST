"use client";
import Link from "next/link";
import {useParams} from "next/navigation";
import {useState,type FormEvent} from "react";
import {authClient} from "@/lib/auth/client";
export default function AuthPage(){
 const params=useParams();const mode=params.path==="sign-up"?"sign-up":"sign-in";
 const [name,setName]=useState(""),[email,setEmail]=useState(""),[password,setPassword]=useState(""),[error,setError]=useState(""),[busy,setBusy]=useState(false);
 async function submit(e:FormEvent){e.preventDefault();setError("");setBusy(true);try{
  const response=mode==="sign-up"?await authClient.signUp.email({name,email,password}):await authClient.signIn.email({email,password});
  if(response.error){setError(response.error.message||"Помилка входу");return}
  window.location.assign("/account");
 }catch{setError("Не вдалося підключитися до Neon Auth. Спробуйте пізніше.")}finally{setBusy(false)}}
 return <main className="customer-page"><header className="customer-header"><Link href="/" className="brand">VEX<span>LUST</span><i>✦</i></Link><Link href="/">До магазину</Link></header><section className="auth-card"><span className="eyebrow">PRIVATE ACCESS</span><h1>{mode==="sign-up"?"Створити акаунт":"Вітаємо знову"}</h1><p>Особистий простір VEXLUST. Безпечний вхід через Neon Auth.</p><form onSubmit={submit}>{mode==="sign-up"&&<label>Ім'я<input required maxLength={70} value={name} onChange={e=>setName(e.target.value)} autoComplete="name"/></label>}<label>Електронна пошта<input type="email" required maxLength={160} value={email} onChange={e=>setEmail(e.target.value)} autoComplete="email"/></label><label>Пароль<input type="password" minLength={8} required value={password} onChange={e=>setPassword(e.target.value)} autoComplete={mode==="sign-in"?"current-password":"new-password"}/></label>{error&&<p className="form-error" role="alert">{error}</p>}<button disabled={busy} className="primary" type="submit">{busy?"Обробка…":mode==="sign-up"?"Зареєструватися":"Увійти"}</button></form><p className="auth-bottom">{mode==="sign-up"?"Вже є акаунт?":"Ще немає акаунта?"} <Link href={mode==="sign-up"?"/auth/sign-in":"/auth/sign-up"}>{mode==="sign-up"?"Увійти":"Реєстрація"}</Link></p><small>Оформлення комерційних замовлень поки вимкнено.</small></section></main>
}