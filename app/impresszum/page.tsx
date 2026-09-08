import type { Metadata } from "next";

export const metadata: Metadata = { title: "Impresszum", robots: { index: true, follow: true } };

export default function ImprintPage() {
  return <article className="mx-auto max-w-4xl px-5 py-12 text-[#263129] sm:py-16"><div className="rounded-[30px] border border-[#e2ddd3] bg-white p-6 shadow-sm sm:p-10">
    <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#a1813a]">DebrecenHomes</p><h1 className="mt-2 text-3xl font-black sm:text-4xl">Impresszum</h1>
    <div className="mt-8 space-y-5 leading-7 text-[#4d5a51]"><p><strong className="text-[#263129]">A weboldal neve:</strong><br />DebrecenHomes</p><p><strong className="text-[#263129]">Kapcsolat:</strong><br /><a className="font-bold text-[#176b3a] underline" href="mailto:inquiries@debrecenhomes.hu">inquiries@debrecenhomes.hu</a></p><p><strong className="text-[#263129]">Tárhelyszolgáltató:</strong><br />Vercel Inc., 440 N Barranca Avenue #4133, Covina, CA 91723, USA</p><p className="rounded-2xl bg-[#fff8e7] p-4 text-sm"><strong>Publikálás előtt kitöltendő:</strong> az üzemeltető hivatalos neve, székhelye, adószáma és – ha alkalmazandó – nyilvántartási száma. Ezeket nem találtam meg a projektben, ezért nem találgattam.</p></div>
  </div></article>;
}
