"use client";

import { useId, useState } from "react";

export const conditionOptions = ["Új építésű", "Újszerű", "Felújított", "Jó állapotú", "Átlagos", "Felújítandó", "Befejezetlen"];
export const floorOptions = ["Nem emeleti ingatlan", "Szuterén", "Alagsor", "Földszint", "Magasföldszint", "Félemelet", ...Array.from({ length: 20 }, (_, index) => `${index + 1}. emelet`), "Tetőtér"];
export const heatingOptions = ["Gázkazán", "Gázkonvektor", "Távfűtés", "Távfűtés egyedi méréssel", "Hőszivattyú", "Elektromos fűtés", "Klímás fűtés", "Vegyes tüzelés", "Központi fűtés", "Padlófűtés", "Nincs fűtés"];
export const parkingOptions = ["Utcai parkolás", "Ingyenes utcai parkolás", "Fizetős utcai parkolás", "Udvari beálló", "Fedett beálló", "Garázs", "Dupla garázs", "Teremgarázs", "Nincs parkoló"];
export const cityOptions = ["Debrecen", "Hajdúszoboszló", "Hajdúböszörmény", "Hajdúhadház", "Hajdúsámson", "Mikepércs", "Ebes", "Bocskaikert", "Sáránd", "Derecske", "Balmazújváros", "Nyíregyháza"];
export const districtOptions = ["Belváros", "Nagyerdő", "Nagyerdőalja", "Sestakert", "Vénkert", "Újkert", "Tócóskert", "Tócóvölgy", "Hatvan utcai kert", "Csigekert", "Biharikert", "Bodobán", "Csapókert", "Dobozi lakótelep", "Epreskert", "Homokkert", "Ispotály", "Józsa", "Alsójózsa", "Felsőjózsa", "Kerekestelep", "Lencztelep", "Libakert", "Széchenyikert", "Tégláskert", "Wesselényi lakótelep", "Nyulas", "Pallag", "Bánk", "Dombostanya", "Kismacs", "Nagymacs", "Ondód", "Pac"];
export const balconyOptions = ["Nincs erkély / terasz", "Erkély", "Terasz", "Loggia", "Franciaerkély", "Erkély és terasz", "Tetőterasz"];
export const roomOptions = Array.from({ length: 24 }, (_, index) => String((index + 1) / 2));

export default function PropertyDetailSelect({ label, value, onChange, options }: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly string[];
}) {
  const id = useId();
  const [custom, setCustom] = useState(false);
  const known = options.includes(value);
  const inputClass = "w-full rounded-2xl border border-[#d8d2c7] bg-[#f5f2ec] px-5 py-4 outline-none transition focus:border-[#b99445]";

  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-sm text-[#879087]">{label}</label>
      <select id={id} value={custom ? "__custom__" : value} onChange={(event) => {
        if (event.target.value === "__custom__") setCustom(true);
        else { setCustom(false); onChange(event.target.value); }
      }} className={inputClass}>
        <option value="">Nincs megadva</option>
        {value && !known && <option value={value}>{value}</option>}
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
        <option value="__custom__">Egyéb – egyedi megadás</option>
      </select>
      {custom && <div className="mt-2">
        <label htmlFor={`${id}-custom`} className="mb-2 block text-sm text-[#879087]">{label} – egyedi érték</label>
        <input id={`${id}-custom`} value={value} onChange={(event) => onChange(event.target.value)} className={inputClass} />
      </div>}
    </div>
  );
}
