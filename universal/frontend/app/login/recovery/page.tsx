"use client";
import React,{useEffect,useState} from "react";
import Link from "next/link";
const api=()=>process.env.NEXT_PUBLIC_API_URL||"http://127.0.0.1:20000";
async function post(path:string,body:unknown){
 const response=await fetch(api()+path,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
 const data=await response.json().catch(()=>null);
 if(!response.ok)throw new Error(typeof data?.message==="string"?data.message:Array.isArray(data?.message)?data.message.join(" "):"The request could not be completed.");
 return data;
}
/**
 * Account recovery and email verification.
 * /login/recovery                → request a reset link
 * /login/recovery?token=…        → choose a new password (link from email)
 * /login/recovery?verify=…       → confirm email ownership (link from email)
 */
export default function RecoveryPage(){
 const [mode,setMode]=useState<"request"|"reset"|"verify">("request");
 const [token,setToken]=useState("");
 const [email,setEmail]=useState(""),[password,setPassword]=useState(""),[confirm,setConfirm]=useState("");
 const [busy,setBusy]=useState(false),[error,setError]=useState(""),[message,setMessage]=useState("");
 useEffect(()=>{
  const params=new URLSearchParams(window.location.search);
  const reset=params.get("token"),verify=params.get("verify");
  if(verify){setMode("verify");setToken(verify);}
  else if(reset){setMode("reset");setToken(reset);}
  // Remove the secret from the address bar once captured.
  if(reset||verify)window.history.replaceState({},"",window.location.pathname);
 },[]);
 const submit=async(event:React.FormEvent)=>{
  event.preventDefault();if(busy)return;setBusy(true);setError("");setMessage("");
  try{
   if(mode==="request"){const data=await post("/auth/recovery/request",{email});setMessage(data.message||"Check your email for a recovery link.");}
   else if(mode==="reset"){
    if(password!==confirm)throw new Error("The two passwords do not match.");
    const data=await post("/auth/recovery/confirm",{token,password});
    localStorage.removeItem("token");localStorage.removeItem("user");
    setMessage(data.message||"Password updated. Sign in with your new password.");
   }else{const data=await post("/auth/verify-email/confirm",{token});setMessage(data.message||"Email verified.");}
  }catch(e:any){setError(e.message);}finally{setBusy(false);}
 };
 useEffect(()=>{if(mode==="verify"&&token&&!message&&!error&&!busy){void submit(new Event("submit") as unknown as React.FormEvent);}},[mode,token]);
 return <main className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-pink-100 via-cyan-100 to-lime-100">
  <section className="w-full max-w-md rounded-3xl bg-white/80 p-8 shadow-2xl text-slate-800">
   <div className="text-center mb-7"><span className="text-4xl" aria-hidden="true">🔑</span>
    <h1 className="text-3xl font-extrabold mt-4">{mode==="request"?"Recover your account":mode==="reset"?"Choose a new password":"Verifying your email"}</h1>
    <p className="mt-2 text-slate-600">{mode==="request"?"We will email a one-time link that proves you own this address.":mode==="reset"?"Your link works once and expires after 30 minutes.":"One moment while we confirm your address."}</p>
   </div>
   {mode!=="verify"&&<form onSubmit={submit} className="space-y-4">
    {mode==="request"&&<label className="block">Email<input required type="email" value={email} onChange={e=>setEmail(e.target.value)} maxLength={254} autoComplete="email" className="mt-1 w-full border rounded-xl p-3"/></label>}
    {mode==="reset"&&<>
     <label className="block">New password<input required type="password" value={password} onChange={e=>setPassword(e.target.value)} minLength={12} maxLength={1024} autoComplete="new-password" className="mt-1 w-full border rounded-xl p-3"/></label>
     <label className="block">Repeat new password<input required type="password" value={confirm} onChange={e=>setConfirm(e.target.value)} minLength={12} maxLength={1024} autoComplete="new-password" className="mt-1 w-full border rounded-xl p-3"/></label>
     <p className="text-xs text-slate-500">Use at least 12 characters. Older sessions on other devices are signed out after the change.</p>
    </>}
    <button disabled={busy||Boolean(message&&mode==="reset")} className="w-full rounded-xl bg-slate-900 p-3 font-bold text-white disabled:opacity-50">{busy?"Please wait…":mode==="request"?"Send recovery link":"Update password"}</button>
   </form>}
   {message&&<p role="status" className="mt-4 text-sm text-emerald-800">{message}</p>}
   {error&&<p role="alert" className="mt-4 text-sm text-red-700">{error}</p>}
   {mode==="request"&&<p className="mt-5 text-xs text-slate-500">Older demo accounts without a verified password can be claimed this way: completing the emailed link proves you own the address.</p>}
   <Link href="/login" className="block text-center mt-5 text-sm text-purple-700">Back to sign in</Link>
  </section>
 </main>;
}
