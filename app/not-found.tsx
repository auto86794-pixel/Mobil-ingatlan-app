import Link from "next/link";
import { Home, Search } from "lucide-react";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[70vh] max-w-3xl items-center px-4 py-12 sm:px-6">
      <div className="w-full rounded-[32px] border border-[#e2ddd3] bg-white p-8 text-center shadow-sm sm:p-12">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#eef5ef] text-2xl font-black text-[#176b3a]">404</div>
        <h1 className="mt-5 text-3xl font-black tracking-tight text-[#172019] sm:text-4xl">Ez az oldal nem található</h1>
        <p className="mx-auto mt-3 max-w-xl leading-7 text-[#667168]">Lehet, hogy a hirdetést már eltávolították, vagy a megnyitott hivatkozás hibás.</p>
        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/properties#ingatlanok" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#176b3a] px-6 font-bold text-white transition hover:bg-[#115b30]"><Search size={18}/> Ingatlanok böngészése</Link>
          <Link href="/" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-[#d8d2c7] bg-[#faf8f4] px-6 font-bold text-[#263129] transition hover:border-[#b9d1c0]"><Home size={18}/> Kezdőlap</Link>
        </div>
      </div>
    </main>
  );
}
