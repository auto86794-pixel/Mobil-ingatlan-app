'use client';
import { useId, useRef, useState, type FormEvent } from 'react';
import { cleanSearchCriteria, searchCriteriaMessage } from '@/app/lib/searchCriteria';
export default function SearchAlert({criteria}: {criteria: Record<string,string>}) {
 const id = useId();
 const [email,setEmail]=useState('');
 const [consent,setConsent]=useState(false);
 const [state,setState]=useState('');
 const [busy,setBusy]=useState(false);
 const pending=useRef(false);
 let summary='';
 try { summary=searchCriteriaMessage(cleanSearchCriteria(criteria)).split('\n').slice(1).join(' · '); } catch { /* Ask the visitor to choose filters. */ }
 async function submit(e:FormEvent) {
  e.preventDefault(); if(pending.current)return;
  pending.current=true;setBusy(true);setState('');
  try {
   const clean=cleanSearchCriteria(criteria);
   const res=await fetch('/api/search-alerts',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,consent,criteria:clean}),signal:AbortSignal.timeout(30000)});
   const data=await res.json();if(!res.ok)throw new Error(data.error || 'Nem sikerült a mentés.');
   setState('A keresési igényedet rögzítettük. Megfelelő ajánlat esetén személyesen keresünk meg.');setEmail('');setConsent(false);
  } catch(err){setState(err instanceof Error?err.message:'Hiba történt.');}
  finally{pending.current=false;setBusy(false);}
 }
 return <section className="my-7 rounded-3xl border border-[#d9ded7] bg-white p-5 sm:p-7">
  <h3 className="text-xl font-bold">Nem találtad meg az otthonod?</h3>
  <p className="my-2 text-sm text-[#59675d]">Rögzítsd a keresési igényed, és megfelelő ajánlat esetén személyesen megkeresünk. Automatikus újingatlan-értesítés még nincs.</p>
  <p className="my-3 text-sm text-[#59675d]">{summary || 'A mentéshez először válassz keresési feltételeket a keresőben.'}</p>
  <form onSubmit={submit} className="mt-4 grid gap-3">
   <label className="text-sm font-semibold" htmlFor={id}>E-mail címed</label>
   <input id={id} type="email" autoComplete="email" required maxLength={254} value={email} onChange={e=>setEmail(e.target.value)} className="w-full rounded-xl border p-3" placeholder="pelda@email.hu"/>
   <label className="flex gap-2 text-sm"><input type="checkbox" required checked={consent} onChange={e=>setConsent(e.target.checked)}/><span>Hozzájárulok, hogy a keresési igényemmel kapcsolatban megkeressenek. <a href="/adatvedelem" className="underline">Adatkezelési tájékoztató</a></span></label>
   <button disabled={busy || !summary} className="rounded-xl bg-[#008000] px-5 py-3 font-bold text-white disabled:opacity-50">{busy?'Mentés…':'Keresési igény mentése'}</button>
  </form>
  {state&&<p role="status" className="mt-3 text-sm">{state}</p>}
 </section>;
}
