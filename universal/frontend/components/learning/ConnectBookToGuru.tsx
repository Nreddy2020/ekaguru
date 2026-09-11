"use client";
import React,{useEffect,useRef,useState} from "react";
import Link from "next/link";
import {ClassroomDialog} from "./ClassroomDialog";
import {guruRequest} from "../../lib/learning/guru-api";
import {connectLocalBook} from "../../lib/learning/guru-upload";
import styles from "./ApprovedClassroom.module.css";

export function ConnectBookToGuru({bookId,physicalPage=1,onClose,onConnected}:{bookId:string;physicalPage?:number;onClose:()=>void;onConnected:(id:string)=>void}){
 const [signedIn,setSignedIn]=useState(false),[loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[error,setError]=useState("");
 const [learners,setLearners]=useState<{id:string;name:string}[]>([]),[learnerId,setLearnerId]=useState("");
 const tokenRef=useRef(""),controller=useRef<AbortController|null>(null),busyRef=useRef(false);
 useEffect(()=>{
   const abort=new AbortController();controller.current=abort;
   tokenRef.current=localStorage.getItem("token")||"";setSignedIn(Boolean(tokenRef.current));
   if(!tokenRef.current){setLoading(false);return()=>abort.abort();}
   guruRequest<{data:{id:string;name:string}[]}>("/api/v2/learners?pageSize=100",undefined,abort.signal).then(result=>{
     if(!abort.signal.aborted){
       if(!Array.isArray(result.data))throw new Error("Learner profiles could not be loaded.");
       setLearners(result.data.filter(l=>typeof l.id==="string"&&typeof l.name==="string"));
     }
   }).catch(e=>{if(!abort.signal.aborted)setError(e.message);}).finally(()=>{if(!abort.signal.aborted)setLoading(false);});
   return()=>abort.abort();
 },[bookId]);
 const connect=async(e:React.FormEvent)=>{
   e.preventDefault();if(!learnerId||busyRef.current||!controller.current)return;
   busyRef.current=true;setBusy(true);setError("");
   try{const result=await connectLocalBook(bookId,learnerId,tokenRef.current,controller.current.signal);if(!controller.current.signal.aborted)onConnected(result.materialId);}
   catch(e:any){if(!controller.current.signal.aborted)setError(e.message);}
   finally{busyRef.current=false;if(!controller.current.signal.aborted)setBusy(false);}
 };
 return <ClassroomDialog title="Connect to Guru" onClose={onClose}>
   <p className="mb-4 text-sm text-slate-300">Save this PDF to your EKAGURU account so Guru can read scanned pages and prepare lessons. Server uploads support up to 50 MB. Your local copy remains available.</p>
   {!signedIn?<p><Link className={styles.sideButton} href={"/login?returnTo="+encodeURIComponent("/library/"+bookId+"?page="+physicalPage)}>Sign in to connect this book</Link></p>:loading?<p role="status">Loading your learner profiles…</p>:<form onSubmit={connect} className="space-y-4">
     {learners.length?<label className="block">Learner<select aria-label="Learner for this book" className="mt-2 block w-full rounded bg-slate-800 p-3" value={learnerId} disabled={busy} onChange={e=>setLearnerId(e.target.value)}><option value="">Choose a learner</option>{learners.map(l=><option key={l.id} value={l.id}>{l.name}</option>)}</select></label>:!error&&<p>No learner profiles are available. <Link href={"/parent/child-setup?returnTo="+encodeURIComponent("/library/"+bookId+"?page="+physicalPage)} className="underline">Set up a learner</Link></p>}
     <button className={styles.primary} disabled={!learnerId||busy}>{busy?"Saving original PDF…":"Save PDF and open Guru"}</button>
   </form>}
   {error&&<p role="alert" className="mt-4 text-amber-200">{error}</p>}
 </ClassroomDialog>;
}
