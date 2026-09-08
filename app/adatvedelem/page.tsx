import type { Metadata } from "next";

export const metadata: Metadata = { title: "Adatvédelmi tájékoztató", description: "A DebrecenHomes adatkezelési tájékoztatója.", alternates: { canonical: "/adatvedelem" } };

export default function PrivacyPage() {
  return <article className="mx-auto max-w-4xl px-5 py-12 text-[#263129] sm:py-16"><div className="rounded-[30px] border border-[#e2ddd3] bg-white p-6 shadow-sm sm:p-10">
    <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#a1813a]">DebrecenHomes</p><h1 className="mt-2 text-3xl font-black sm:text-4xl">Adatvédelmi tájékoztató</h1><p className="mt-3 text-sm text-[#6c776f]">Hatályos: 2026. szeptember 7.</p>
    <div className="mt-8 space-y-7 leading-7 text-[#4d5a51]">
      <section><h2 className="text-xl font-bold text-[#263129]">Adatkezelő és kapcsolat</h2><p className="mt-2">A szolgáltatás adatkezelője a DebrecenHomes. Adatvédelmi kérdésben az <a className="font-bold text-[#176b3a] underline" href="mailto:inquiries@debrecenhomes.hu">inquiries@debrecenhomes.hu</a> címen érhető el.</p></section>
      <section><h2 className="text-xl font-bold text-[#263129]">Milyen adatokat kezelünk?</h2><p className="mt-2">Regisztrációkor az e-mail-címet és a fiókhoz szükséges technikai azonosítókat; érdeklődéskor a megadott nevet, e-mail-címet, telefonszámot, üzenetet és az érintett ingatlan azonosítóját kezeljük.</p></section>
      <section><h2 className="text-xl font-bold text-[#263129]">Cél és jogalap</h2><p className="mt-2">Az adatkezelés célja a fiók működtetése, a kedvencek tárolása, valamint az ingatlanérdeklődések továbbítása és megválaszolása. Jogalapja a szolgáltatás teljesítése, a kapcsolatfelvételhez szükséges lépések megtétele, illetve a szolgáltatás biztonságához fűződő jogos érdek.</p></section>
      <section><h2 className="text-xl font-bold text-[#263129]">Adatfeldolgozók és megőrzés</h2><p className="mt-2">A működéshez Firebase-szolgáltatásokat, az üzenetek továbbításához Brevót, a tárhelyszolgáltatáshoz pedig Vercelt használunk. Az adatokat csak a cél teljesítéséhez szükséges ideig, illetve a vonatkozó jogszabályok szerinti ideig őrizzük meg.</p></section>
      <section><h2 className="text-xl font-bold text-[#263129]">Érintetti jogok</h2><p className="mt-2">Kérhetsz hozzáférést, helyesbítést, törlést, korlátozást vagy adathordozhatóságot, és tiltakozhatsz az adatkezelés ellen. Panasszal a Nemzeti Adatvédelmi és Információszabadság Hatósághoz is fordulhatsz.</p></section>
    </div>
  </div></article>;
}
