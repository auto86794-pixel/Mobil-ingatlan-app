import type { Metadata } from "next";
const operator = {
  name: process.env.LEGAL_OPERATOR_NAME?.trim(), address: process.env.LEGAL_OPERATOR_ADDRESS?.trim(),
  taxId: process.env.LEGAL_OPERATOR_TAX_ID?.trim(), registration: process.env.LEGAL_OPERATOR_REGISTRATION?.trim(),
};
export const metadata: Metadata = { title: "Impresszum", robots: { index: !!(operator.name && operator.address && operator.taxId), follow: true } };
export default function ImprintPage() {
  const entries = [
    ["A weboldal neve", "Debreceni Otthonok"], ["Üzemeltető", operator.name], ["Székhely", operator.address],
    ["Adószám", operator.taxId], ["Nyilvántartási szám", operator.registration],
    ["Tárhelyszolgáltató", "Vercel Inc., 440 N Barranca Avenue #4133, Covina, CA 91723, USA"],
  ];
  return <article className="mx-auto max-w-4xl px-5 py-12 text-[#263129] sm:py-16"><div className="rounded-[30px] border border-[#e2ddd3] bg-white p-6 shadow-sm sm:p-10">
    <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#a1813a]">Debreceni Otthonok</p>
    <h1 className="mt-2 text-3xl font-black sm:text-4xl">Impresszum</h1>
    <dl className="mt-8 space-y-5 leading-7 text-[#4d5a51]">
      {entries.filter(([, value]) => value).map(([label, value]) => <div key={label}><dt className="font-bold text-[#263129]">{label}</dt><dd>{value}</dd></div>)}
      <div><dt className="font-bold text-[#263129]">Kapcsolat</dt><dd><a className="font-bold text-[#176b3a] underline" href="mailto:inquiries@debrecenhomes.hu">inquiries@debrecenhomes.hu</a></dd></div>
    </dl>
  </div></article>;
}
