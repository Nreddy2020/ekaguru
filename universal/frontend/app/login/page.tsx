"use client";
import React,{useState,useEffect} from "react";
import Link from "next/link";
export default function LoginPage(){
 const [register,setRegister]=useState(false),[email,setEmail]=useState(""),[password,setPassword]=useState(""),[name,setName]=useState(""),[busy,setBusy]=useState(false),[error,setError]=useState("");
 const [signedIn,setSignedIn]=useState(false);useEffect(()=>setSignedIn(Boolean(localStorage.getItem("token"))),[]);
 const submit=async(event:React.FormEvent)=>{
  event.preventDefault();if(busy)return;setBusy(true);setError("");
  try{
   const response=await fetch((process.env.NEXT_PUBLIC_API_URL||"http://127.0.0.1:20000")+"/auth/"+(register?"register":"login"),{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email,password,...(register?{name}:{})})});
   const data=await response.json().catch(()=>null);
   if(!response.ok)throw new Error(typeof data?.message==="string"?data.message:Array.isArray(data?.message)?data.message.join(" "):"Sign-in could not be completed.");
   if(typeof data?.access_token!=="string"||data?.user?.authVersion!==2)throw new Error("The sign-in response could not be verified.");
   localStorage.setItem("token",data.access_token);localStorage.setItem("user",JSON.stringify(data.user));
   const returnTo=new URLSearchParams(window.location.search).get("returnTo");
   let destination="/learn";try{const target=new URL(returnTo||"/learn",window.location.origin);if(target.origin===window.location.origin)destination=target.pathname+target.search;}catch{}
   window.location.assign(destination);
  }catch(e:any){setError(e.message);}finally{setBusy(false);}
 };
 return <main className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-pink-100 via-cyan-100 to-lime-100">
  <section className="w-full max-w-md rounded-3xl bg-white/80 p-8 shadow-2xl text-slate-800">
   <div className="text-center mb-7"><span className="text-4xl" aria-hidden="true">📚</span><h1 className="text-3xl font-extrabold mt-4">Welcome to EKAGURU</h1><p className="mt-2 text-slate-600">{register?"Create your parent account":"Sign in to your learning account"}</p></div>
   <form onSubmit={submit} className="space-y-4">
    {register&&<label className="block">Name<input required value={name} onChange={e=>setName(e.target.value)} maxLength={120} autoComplete="name" className="mt-1 w-full border rounded-xl p-3"/></label>}
    <label className="block">Email<input required type="email" value={email} onChange={e=>setEmail(e.target.value)} maxLength={254} autoComplete="email" className="mt-1 w-full border rounded-xl p-3"/></label>
    <label className="block">Password<input required type="password" value={password} onChange={e=>setPassword(e.target.value)} minLength={register?12:1} maxLength={1024} autoComplete={register?"new-password":"current-password"} className="mt-1 w-full border rounded-xl p-3"/></label>
    {register&&<p className="text-xs text-slate-500">Use at least 12 characters. Your account starts without any learner profiles.</p>}
    <button disabled={busy} className="w-full rounded-xl bg-slate-900 p-3 font-bold text-white disabled:opacity-50">{busy?"Please wait…":register?"Create account":"Sign in"}</button>
    {error&&<p role="alert" className="text-sm text-red-700">{error}</p>}
   </form>
   <button disabled={busy} onClick={()=>{setRegister(v=>!v);setError("");setPassword("");}} className="block mx-auto mt-5 text-sm underline">{register?"Already have an account? Sign in":"Create a parent account"}</button>
   {!register&&<Link href="/login/recovery" className="block text-center mt-3 text-sm underline">Forgot your password, or claiming an older account?</Link>}
   <p className="mt-5 text-xs text-slate-500">Older demo accounts do not have verified passwords. Account recovery must establish ownership before private books can be connected.</p>
   {signedIn&&<button onClick={()=>{localStorage.removeItem("token");localStorage.removeItem("user");window.location.assign("/learn");}} className="block mx-auto mt-4 text-sm underline">Sign out on this device</button>}
   <Link href="/learn" className="block text-center mt-5 text-sm text-purple-700">Return to your local textbooks</Link>
  </section>
 </main>;
}
