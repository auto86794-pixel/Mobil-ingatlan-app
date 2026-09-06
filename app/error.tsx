"use client";

import Link from "next/link";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="mx-auto flex min-h-[70vh] max-w-3xl items-center px-4 py-12 sm:px-6">
      <div className="w-full rounded-[32px] border border-[#eadfd6] bg-white p-8 text-center shadow-sm sm:p-12">
        <AlertTriangle className="mx-auto h-14 w-14 text-[#a1813a]" />
        <h1 className="mt-5 text-3xl font-black text-[#172019]">Valami nem sikerült</h1>
        <p className="mx-auto mt-3 max-w-xl leading-7 text-[#667168]">Az oldal betöltése közben hiba történt. Próbáld újra, vagy térj vissza az ingatlanokhoz.</p>
        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          <button type="button" onClick={reset} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#176b3a] px-6 font-bold text-white transition hover:bg-[#115b30]"><RefreshCw size={18}/> Újrapróbálom</button>
          <Link href="/properties#ingatlanok" className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-[#d8d2c7] bg-[#faf8f4] px-6 font-bold text-[#263129]">Ingatlanok</Link>
        </div>
      </div>
    </main>
  );
}
