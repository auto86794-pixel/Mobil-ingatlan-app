import { listingQuality } from '@/app/lib/listingQuality';
import type { Property } from '@/app/lib/types';
export default function ListingQuality({ property }: { property: Partial<Property> }) {
 const {score, missing} = listingQuality(property);
 return <section className="rounded-2xl border border-[#d8d2c7] bg-[#f7f4ee] p-5 my-5" aria-label="Hirdetés minősége">
  <div className="flex justify-between gap-3 font-bold"><span>Hirdetés teljessége</span><span>{score}%</span></div>
  <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#dedbd2]"><div className="h-full bg-[#008000]" style={{width:`${score}%`}} /></div>
  {missing.length ? <><p className="mt-3 text-sm">A jobb megjelenéshez még érdemes pótolni:</p><ul className="mt-2 list-disc pl-5 text-sm">{missing.map(x=><li key={x}>{x}</li>)}</ul></> : <p className="mt-3 text-sm">Minden alapvető adat kitöltve.</p>}
 </section>;
}
