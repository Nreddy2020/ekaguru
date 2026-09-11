"use client";
import React,{useEffect,useMemo,useState} from "react";
import Link from "next/link";
import {guruRequest,waitForGuruJob,describeGuruStage,GuruJob} from "../../../lib/learning/guru-api";

type Criterion={id:string;title:string;question:string;weight:number;gate?:boolean};
type Rubric={version:number;criteria:Criterion[];passMinimum:number;minimumPassedCases:number};
type CaseRow={id:string;bookId:string;physicalPage:number;subject:string;gradeBand:string;language:string;depth:string;prepared:boolean;reviewCount:number;consensus:string;meanWeightedScore:number|null};
type Summary={rubricVersion:number;minimumPassedCases:number;totalCases:number;groups:{subject:string;depth:string;language:string;cases:number;prepared:number;reviewed:number;passed:number;failed:number}[];approvedDepths:{depth:string;language:string;passed:number}[]};
type Packet={case:CaseRow&{sourceHash?:string|null;artifactId?:string|null};rubric:Rubric;lesson:any;page:any;audit:any;reviews:{id:string;reviewerId:string;rubricVersion:number;scores:Record<string,number>;verdict:string;notes?:string|null;createdAt:string}[]};
type Mapping={id:string;conceptId:string;method:string;score:number;status:"PROPOSED"|"VERIFIED"|"REJECTED";rationale?:string|null;reviewedBy?:string|null;concept:{id:string;canonicalName:string;domain?:string|null}};
type ConceptHit={id:string;canonicalName:string;domain?:string|null;gradeBand?:string;definition?:string|null};

const BASE="/api/v2/guru/evaluation";
const DEPTHS=["basis","developing","proficient","advanced","deep"];
function deriveVerdict(rubric:Rubric,scores:Record<string,number>){
 for(const c of rubric.criteria){const v=scores[c.id];if(v===0)return "FAIL";if(c.gate&&v<rubric.passMinimum)return "FAIL";}
 return rubric.criteria.every(c=>scores[c.id]>=rubric.passMinimum)?"PASS":"REVISE";
}

/** Curator console for the educator-reviewed Guru evaluation corpus (ADMIN only). */
export default function GuruEvaluationPage(){
 const [signedIn,setSignedIn]=useState(true),[error,setError]=useState(""),[loading,setLoading]=useState(true);
 const [summary,setSummary]=useState<Summary|null>(null),[cases,setCases]=useState<CaseRow[]>([]),[rubric,setRubric]=useState<Rubric|null>(null);
 const [subject,setSubject]=useState(""),[depth,setDepth]=useState("");
 const [packet,setPacket]=useState<Packet|null>(null),[packetBusy,setPacketBusy]=useState(false),[notice,setNotice]=useState("");
 const [scores,setScores]=useState<Record<string,number>>({}),[verdict,setVerdict]=useState(""),[notes,setNotes]=useState("");
 const [mappings,setMappings]=useState<Mapping[]>([]),[conceptQuery,setConceptQuery]=useState(""),[conceptHits,setConceptHits]=useState<ConceptHit[]>([]),[mappingBusy,setMappingBusy]=useState(false);
 const loadMappings=async(artifactId:string)=>{
  try{setMappings(await guruRequest<Mapping[]>("/api/v2/guru/lessons/"+encodeURIComponent(artifactId)+"/concept-mappings"));}
  catch(e:any){setError(e.message);}
 };
 const mappingAction=async(run:()=>Promise<unknown>,done:string)=>{
  if(!packet?.case.artifactId)return;setMappingBusy(true);setError("");setNotice("");
  try{await run();await loadMappings(packet.case.artifactId);setNotice(done);}
  catch(e:any){setError(e.message);}finally{setMappingBusy(false);}
 };
 const searchConcepts=async(event:React.FormEvent)=>{
  event.preventDefault();setMappingBusy(true);setError("");
  try{setConceptHits(await guruRequest<ConceptHit[]>("/api/v2/guru/concepts?search="+encodeURIComponent(conceptQuery.trim())));}
  catch(e:any){setError(e.message);}finally{setMappingBusy(false);}
 };
 const load=async()=>{
  setLoading(true);setError("");
  try{
   const [s,c,r]=await Promise.all([guruRequest<Summary>(BASE+"/summary"),guruRequest<CaseRow[]>(BASE+"/cases"),guruRequest<Rubric>(BASE+"/rubric")]);
   setSummary(s);setCases(c);setRubric(r);
  }catch(e:any){setError(e.message);}finally{setLoading(false);}
 };
 useEffect(()=>{if(!localStorage.getItem("token")){setSignedIn(false);setLoading(false);return;}void load();},[]);
 const subjects=useMemo(()=>Array.from(new Set(cases.map(c=>c.subject))).sort(),[cases]);
 const visible=cases.filter(c=>(!subject||c.subject===subject)&&(!depth||c.depth===depth));
 const open=async(id:string)=>{
  setPacketBusy(true);setNotice("");setError("");
  try{const p=await guruRequest<Packet>(BASE+"/cases/"+encodeURIComponent(id)+"/packet");setPacket(p);
   const initial:Record<string,number>={};for(const c of p.rubric.criteria)initial[c.id]=3;setScores(initial);setVerdict("");setNotes("");
   setConceptHits([]);setConceptQuery("");if(p.case.artifactId)await loadMappings(p.case.artifactId);else setMappings([]);}
  catch(e:any){setError(e.message);}finally{setPacketBusy(false);}
 };
 const prepare=async()=>{
  if(!packet)return;setPacketBusy(true);setNotice("");setError("");
  try{const r=await guruRequest<{caseId:string;job:GuruJob}>(BASE+"/cases/"+encodeURIComponent(packet.case.id)+"/prepare",{});
   const done=await waitForGuruJob(r.job,undefined,stage=>setNotice(describeGuruStage(stage)));
   await open(packet.case.id);await load();setNotice("Lesson prepared: "+done.artifactId);}
  catch(e:any){setError(e.message);}finally{setPacketBusy(false);}
 };
 const submitReview=async(event:React.FormEvent)=>{
  event.preventDefault();if(!packet||!rubric)return;setPacketBusy(true);setNotice("");setError("");
  try{const r=await guruRequest<{verdict:string;weightedScore:number}>(BASE+"/cases/"+encodeURIComponent(packet.case.id)+"/reviews",{scores,...(verdict?{verdict}:{}),...(notes.trim()?{notes:notes.trim()}:{})});
   await open(packet.case.id);await load();setNotice("Review saved: "+r.verdict+" (weighted "+Math.round(r.weightedScore*100)+"%)");}
  catch(e:any){setError(e.message);}finally{setPacketBusy(false);}
 };
 const copyMarkdown=async()=>{
  if(!packet)return;
  try{const token=localStorage.getItem("token")||"";const response=await fetch((process.env.NEXT_PUBLIC_API_URL||"http://127.0.0.1:20000")+BASE+"/cases/"+encodeURIComponent(packet.case.id)+"/packet.md",{headers:{Authorization:"Bearer "+token}});
   if(!response.ok)throw new Error("Packet export failed.");await navigator.clipboard.writeText(await response.text());setNotice("Markdown packet copied to the clipboard.");}
  catch(e:any){setError(e.message);}
 };
 const derived=rubric&&Object.keys(scores).length?deriveVerdict(rubric,scores):"";
 return <main className="min-h-screen bg-gray-50 p-8 text-gray-900">
  <div className="max-w-7xl mx-auto space-y-8">
   <header className="flex flex-wrap items-end justify-between gap-4">
    <div><h1 className="text-3xl font-bold">Guru evaluation corpus</h1><p className="text-gray-500">Educator review of generated page lessons. Consensus PASS cases unlock the mastery bridge per depth and language.</p></div>
    <Link href="/admin" className="text-sm underline">Admin console</Link>
   </header>
   {!signedIn&&<p role="alert" className="rounded bg-amber-100 p-4">Sign in with a curator (ADMIN) account to review lessons. <Link className="underline" href="/login?returnTo=/admin/guru-evaluation">Sign in</Link></p>}
   {error&&<p role="alert" className="rounded bg-red-100 p-4 text-red-800">{error}</p>}
   {notice&&<p role="status" className="rounded bg-emerald-100 p-4 text-emerald-900">{notice}</p>}
   {loading&&signedIn&&<p role="status">Loading corpus…</p>}
   {summary&&<section aria-label="Corpus summary" className="rounded-xl bg-white p-6 shadow">
    <h2 className="text-xl font-semibold">Summary</h2>
    <p className="mt-1 text-sm text-gray-600">{summary.totalCases} cases · rubric v{summary.rubricVersion} · {summary.minimumPassedCases} consensus passes needed per depth and language</p>
    <p className="mt-1 text-sm">{summary.approvedDepths.length?"Approved: "+summary.approvedDepths.map(d=>d.depth+" ("+d.language+", "+d.passed+")").join(", "):"No depth has reached the approval threshold yet."}</p>
    <div className="mt-4 overflow-x-auto"><table className="min-w-full text-sm"><thead><tr className="text-left text-gray-500"><th className="pr-4">Subject</th><th className="pr-4">Depth</th><th className="pr-4">Lang</th><th className="pr-4">Cases</th><th className="pr-4">Prepared</th><th className="pr-4">Reviewed</th><th className="pr-4">Passed</th><th>Failed</th></tr></thead>
     <tbody>{summary.groups.map(g=><tr key={g.subject+g.depth+g.language} className="border-t"><td className="pr-4 py-1">{g.subject}</td><td className="pr-4">{g.depth}</td><td className="pr-4">{g.language}</td><td className="pr-4">{g.cases}</td><td className="pr-4">{g.prepared}</td><td className="pr-4">{g.reviewed}</td><td className="pr-4">{g.passed}</td><td>{g.failed}</td></tr>)}</tbody></table></div>
   </section>}
   {signedIn&&!loading&&<section aria-label="Cases" className="rounded-xl bg-white p-6 shadow">
    <div className="flex flex-wrap items-center gap-4">
     <h2 className="text-xl font-semibold">Cases</h2>
     <label className="text-sm">Subject <select aria-label="Filter by subject" value={subject} onChange={e=>setSubject(e.target.value)} className="ml-1 rounded border p-1"><option value="">All</option>{subjects.map(s=><option key={s} value={s}>{s}</option>)}</select></label>
     <label className="text-sm">Depth <select aria-label="Filter by depth" value={depth} onChange={e=>setDepth(e.target.value)} className="ml-1 rounded border p-1"><option value="">All</option>{DEPTHS.map(d=><option key={d} value={d}>{d}</option>)}</select></label>
     <span className="text-sm text-gray-500">{visible.length} shown</span>
    </div>
    {!cases.length&&<p className="mt-3 text-sm text-gray-600">No cases yet. Seed the v1 manifest from universal/backend with <code>node scripts/seed_guru_evaluation_corpus.js</code>.</p>}
    <div className="mt-4 overflow-x-auto"><table className="min-w-full text-sm"><thead><tr className="text-left text-gray-500"><th className="pr-4">Book</th><th className="pr-4">Page</th><th className="pr-4">Subject</th><th className="pr-4">Depth</th><th className="pr-4">Prepared</th><th className="pr-4">Reviews</th><th className="pr-4">Consensus</th><th></th></tr></thead>
     <tbody>{visible.map(c=><tr key={c.id} className="border-t"><td className="pr-4 py-1">{c.bookId}</td><td className="pr-4">{c.physicalPage}</td><td className="pr-4">{c.subject}</td><td className="pr-4">{c.depth}</td><td className="pr-4">{c.prepared?"yes":"no"}</td><td className="pr-4">{c.reviewCount}</td><td className="pr-4">{c.consensus}</td><td><button onClick={()=>void open(c.id)} disabled={packetBusy} className="rounded bg-slate-900 px-2 py-1 text-white disabled:opacity-50">Open {c.bookId} p{c.physicalPage} {c.depth}</button></td></tr>)}</tbody></table></div>
   </section>}
   {packet&&rubric&&<section aria-label="Review packet" className="rounded-xl bg-white p-6 shadow space-y-6">
    <div className="flex flex-wrap items-start justify-between gap-4">
     <div><h2 className="text-xl font-semibold">{packet.case.bookId} · physical page {packet.case.physicalPage} · {packet.case.depth} · {packet.case.language}</h2>
      <p className="text-sm text-gray-600">{packet.case.subject} · {packet.case.gradeBand} · {packet.case.artifactId?"lesson "+packet.case.artifactId.slice(0,12)+"… · source "+(packet.case.sourceHash||"").slice(0,12)+"…":"not prepared"}</p></div>
     <div className="flex gap-2">
      <button onClick={()=>void prepare()} disabled={packetBusy} className="rounded bg-purple-700 px-3 py-2 text-white disabled:opacity-50">{packet.case.artifactId?"Regenerate lesson":"Prepare lesson"}</button>
      <button onClick={()=>void copyMarkdown()} disabled={!packet.case.artifactId||packetBusy} className="rounded border px-3 py-2 disabled:opacity-50">Copy Markdown packet</button>
     </div>
    </div>
    {!packet.lesson&&<p className="text-sm text-gray-600">Prepare the lesson first. This uses the learner-facing planner and requires a configured Guru provider key on the server.</p>}
    {packet.lesson&&<div className="grid gap-6 lg:grid-cols-2">
     <div>
      <h3 className="font-semibold">Objectives</h3><ul className="list-disc pl-5 text-sm">{(packet.lesson.objectives||[]).map((o:string,i:number)=><li key={i}>{o}</li>)}</ul>
      <h3 className="mt-4 font-semibold">Actions</h3>
      <ol className="list-decimal space-y-2 pl-5 text-sm">{(packet.lesson.actions||[]).map((a:any)=><li key={a.id}><span className="font-mono text-xs uppercase text-gray-500">{a.kind}</span> {a.text}<div className="text-gray-600">Speech: {a.speech}</div><div className="text-xs text-gray-500">Evidence: {(a.evidenceIds||[]).join(", ")}</div>
       {a.rubric&&<div className="mt-1 rounded bg-amber-50 p-2 text-xs"><div>Expected: {a.rubric.expected}</div><div>Criteria: {a.rubric.criteria.join(" | ")}</div><div>Hint: {a.rubric.hint}</div><div>Misconception: {a.rubric.misconception}</div></div>}</li>)}</ol>
     </div>
     <div>
      <h3 className="font-semibold">Source blocks</h3>
      <ul className="space-y-1 text-sm">{(packet.page?.blocks||[]).map((b:any)=><li key={b.blockId}><span className="font-mono text-xs text-gray-500">{b.blockId} [{b.type}, {Math.round((b.confidence||0)*100)}%]</span> {b.text}</li>)}</ul>
      {packet.audit&&<p className="mt-3 text-xs text-gray-500">Model review: {packet.audit.model} at {packet.audit.reviewedAt}. A model review is not educator certification.</p>}
     </div>
    </div>}
    {packet.case.artifactId&&<form onSubmit={submitReview} className="space-y-4 rounded-xl bg-gray-50 p-4">
     <h3 className="font-semibold">Your review (rubric v{rubric.version}, 0–4, pass at {rubric.passMinimum})</h3>
     {rubric.criteria.map(c=><label key={c.id} className="block text-sm"><span className="font-medium">{c.title}{c.gate?" (gate)":""}</span> — {c.question}
      <select aria-label={c.title} value={scores[c.id]??3} onChange={e=>setScores(s=>({...s,[c.id]:Number(e.target.value)}))} className="ml-2 rounded border p-1">{[0,1,2,3,4].map(v=><option key={v} value={v}>{v}</option>)}</select></label>)}
     <label className="block text-sm">Verdict (scores allow {derived}) <select aria-label="Verdict" value={verdict} onChange={e=>setVerdict(e.target.value)} className="ml-2 rounded border p-1"><option value="">Use derived: {derived}</option><option value="PASS">PASS</option><option value="REVISE">REVISE</option><option value="FAIL">FAIL</option></select></label>
     <label className="block text-sm">Notes<textarea aria-label="Review notes" value={notes} onChange={e=>setNotes(e.target.value)} maxLength={4000} className="mt-1 block w-full rounded border p-2"/></label>
     <button type="submit" disabled={packetBusy} className="rounded bg-emerald-700 px-3 py-2 text-white disabled:opacity-50">Save review</button>
    </form>}
    {packet.case.artifactId&&<section aria-label="Concept mappings" className="space-y-3 rounded-xl bg-gray-50 p-4">
     <div className="flex flex-wrap items-center justify-between gap-2">
      <h3 className="font-semibold">Concept mappings</h3>
      <button type="button" disabled={mappingBusy} onClick={()=>void mappingAction(()=>guruRequest("/api/v2/guru/lessons/"+encodeURIComponent(packet.case.artifactId!)+"/concept-mappings/propose",{}),"Proposals refreshed from extraction provenance.")} className="rounded border px-3 py-1 text-sm disabled:opacity-50">Propose from extraction</button>
     </div>
     <p className="text-xs text-gray-600">Only VERIFIED mappings let this lesson's checkpoints reach canonical mastery, and only once the depth passes educator review. Built-in scans have no extraction provenance, so link concepts manually.</p>
     {!mappings.length?<p className="text-sm text-gray-600">No mappings yet.</p>:<ul className="space-y-2 text-sm">{mappings.map(m=><li key={m.id} className="flex flex-wrap items-center gap-2 rounded bg-white p-2">
      <span className="font-medium">{m.concept.canonicalName}</span><span className="text-xs text-gray-500">{m.concept.domain||""} · {m.method} · score {m.score}</span>
      <span className={"rounded px-2 py-0.5 text-xs "+(m.status==="VERIFIED"?"bg-emerald-100 text-emerald-900":m.status==="REJECTED"?"bg-red-100 text-red-900":"bg-amber-100 text-amber-900")}>{m.status}</span>
      {m.rationale&&<span className="w-full text-xs text-gray-600">{m.rationale}</span>}
      {m.status!=="VERIFIED"&&<button type="button" disabled={mappingBusy} onClick={()=>void mappingAction(()=>guruRequest("/api/v2/guru/concept-mappings/"+encodeURIComponent(m.id)+"/review",{status:"VERIFIED"}),"Mapping verified: "+m.concept.canonicalName)} className="rounded bg-emerald-700 px-2 py-1 text-xs text-white disabled:opacity-50">Verify {m.concept.canonicalName}</button>}
      {m.status!=="REJECTED"&&<button type="button" disabled={mappingBusy} onClick={()=>void mappingAction(()=>guruRequest("/api/v2/guru/concept-mappings/"+encodeURIComponent(m.id)+"/review",{status:"REJECTED"}),"Mapping rejected: "+m.concept.canonicalName)} className="rounded border px-2 py-1 text-xs disabled:opacity-50">Reject {m.concept.canonicalName}</button>}
     </li>)}</ul>}
     <form onSubmit={searchConcepts} className="flex flex-wrap items-end gap-2">
      <label className="text-sm">Link a canonical concept<input aria-label="Search concepts" value={conceptQuery} onChange={e=>setConceptQuery(e.target.value)} minLength={2} maxLength={120} className="ml-2 rounded border p-1" placeholder="e.g. photosynthesis"/></label>
      <button type="submit" disabled={mappingBusy||conceptQuery.trim().length<2} className="rounded border px-3 py-1 text-sm disabled:opacity-50">Search concepts</button>
     </form>
     {conceptHits.length>0&&<ul className="space-y-1 text-sm">{conceptHits.map(c=><li key={c.id} className="flex flex-wrap items-center gap-2"><span>{c.canonicalName}</span><span className="text-xs text-gray-500">{c.domain||""}{c.gradeBand?" · "+c.gradeBand:""}</span>
      <button type="button" disabled={mappingBusy} onClick={()=>void mappingAction(()=>guruRequest("/api/v2/guru/lessons/"+encodeURIComponent(packet.case.artifactId!)+"/concept-mappings",{conceptId:c.id,rationale:"Manual curator link from the evaluation page"}),"Linked and verified: "+c.canonicalName)} className="rounded bg-slate-900 px-2 py-1 text-xs text-white disabled:opacity-50">Link {c.canonicalName}</button></li>)}</ul>}
    </section>}
    <div><h3 className="font-semibold">Existing reviews</h3>{!packet.reviews.length?<p className="text-sm text-gray-600">None yet.</p>:<ul className="space-y-1 text-sm">{packet.reviews.map(r=><li key={r.id}><strong>{r.verdict}</strong> by {r.reviewerId} (v{r.rubricVersion}) · {Object.entries(r.scores).map(([k,v])=>k+"="+v).join(", ")}{r.notes?" · "+r.notes:""}</li>)}</ul>}</div>
   </section>}
  </div>
 </main>;
}
