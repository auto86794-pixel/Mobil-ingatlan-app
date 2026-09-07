"use client";

import {
  ChevronDown,
  RotateCcw,
  Search,
  SlidersHorizontal,
  Sparkles,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";

export type SortOption = "featured" | "newest" | "priceAsc" | "priceDesc";
export type SearchFilters = {
  query: string;
  city: string;
  district: string;
  propertyType: string;
  minPrice: string;
  maxPrice: string;
  minArea: string;
  maxArea: string;
  minRooms: string;
  condition: string;
  parking: string;
  balcony: string;
  heating: string;
  sort: SortOption;
};

type FilterOptions = {
  districts: string[];
  propertyTypes: string[];
  conditions: string[];
  parking: string[];
  balconies: string[];
  heating: string[];
};

type PropertyFiltersProps = {
  filters: SearchFilters;
  setFilters: (value: SearchFilters) => void;
  options: FilterOptions;
  resultCount: number;
  onReset: () => void;
  onShowResults: () => void;
};

const fieldClass =
  "w-full rounded-2xl border border-[#ded8ce] bg-white px-4 py-3.5 text-sm text-[#263129] outline-none transition placeholder:text-[#9aa29b] hover:border-[#c9c1b4] focus:border-[#176b3a]/50 focus:ring-4 focus:ring-[#176b3a]/[0.07]";

const moneyLabel = (value: string) => {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0) return value;
  return amount >= 1_000_000
    ? `${new Intl.NumberFormat("hu-HU", { maximumFractionDigits: 1 }).format(amount / 1_000_000)} M Ft`
    : `${new Intl.NumberFormat("hu-HU").format(amount)} Ft`;
};

export default function PropertyFilters({
  filters,
  setFilters,
  options,
  resultCount,
  onReset,
  onShowResults,
}: PropertyFiltersProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const update = (key: keyof SearchFilters, value: string) =>
    setFilters({ ...filters, [key]: value } as SearchFilters);

  const clearFilter = (key: keyof SearchFilters) => {
    if (key === "sort") {
      setFilters({ ...filters, sort: "featured" });
      return;
    }
    update(key, "");
  };

  const advancedCount = [
    filters.district,
    filters.minPrice,
    filters.minArea,
    filters.maxArea,
    filters.minRooms,
    filters.condition,
    filters.parking,
    filters.balcony,
    filters.heating,
  ].filter(Boolean).length;

  const activeCount = [
    filters.query,
    filters.city,
    filters.propertyType,
    filters.maxPrice,
    filters.district,
    filters.minPrice,
    filters.minArea,
    filters.maxArea,
    filters.minRooms,
    filters.condition,
    filters.parking,
    filters.balcony,
    filters.heating,
  ].filter(Boolean).length;

  const activeChips = useMemo(() => {
    const chips: Array<{ key: keyof SearchFilters; label: string }> = [];
    if (filters.query) chips.push({ key: "query", label: `„${filters.query}”` });
    if (filters.city) chips.push({ key: "city", label: filters.city });
    if (filters.district) chips.push({ key: "district", label: filters.district });
    if (filters.propertyType) chips.push({ key: "propertyType", label: filters.propertyType });
    if (filters.condition) chips.push({ key: "condition", label: filters.condition });
    if (filters.minPrice) chips.push({ key: "minPrice", label: `Min. ${moneyLabel(filters.minPrice)}` });
    if (filters.maxPrice) chips.push({ key: "maxPrice", label: `Max. ${moneyLabel(filters.maxPrice)}` });
    if (filters.minArea) chips.push({ key: "minArea", label: `Min. ${filters.minArea} m²` });
    if (filters.maxArea) chips.push({ key: "maxArea", label: `Max. ${filters.maxArea} m²` });
    if (filters.minRooms) chips.push({ key: "minRooms", label: `${filters.minRooms}+ szoba` });
    if (filters.parking) chips.push({ key: "parking", label: filters.parking });
    if (filters.balcony) chips.push({ key: "balcony", label: filters.balcony });
    if (filters.heating) chips.push({ key: "heating", label: filters.heating });
    return chips;
  }, [filters]);

  const resetAll = () => {
    onReset();
    setMobileOpen(false);
  };

  const hasApartment = options.propertyTypes.some((item) =>
    item.toLocaleLowerCase("hu-HU").includes("lakás")
  );
  const hasHouse = options.propertyTypes.some((item) =>
    item.toLocaleLowerCase("hu-HU").includes("ház")
  );
  const apartmentType = options.propertyTypes.find((item) =>
    item.toLocaleLowerCase("hu-HU").includes("lakás")
  );
  const houseType = options.propertyTypes.find((item) =>
    item.toLocaleLowerCase("hu-HU").includes("ház")
  );

  return (
    <div className="rounded-[28px] border border-[#e2ddd3] bg-white/95 p-4 shadow-[0_18px_55px_rgba(54,46,32,.10)] backdrop-blur-2xl md:p-5">
      <div className="mb-3 flex flex-wrap items-center gap-2 md:mb-4">
        <span className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-[0.12em] text-[#8b7338]">
          <Sparkles size={14} /> Gyors keresések
        </span>
        <button type="button" onClick={() => update("city", "Debrecen")} className="rounded-full border border-[#ded8ce] bg-[#faf8f4] px-3 py-1.5 text-xs font-bold text-[#445048] transition hover:border-[#b9d1c0] hover:text-[#176b3a]">Debrecen</button>
        {hasApartment && apartmentType ? <button type="button" onClick={() => update("propertyType", apartmentType)} className="rounded-full border border-[#ded8ce] bg-[#faf8f4] px-3 py-1.5 text-xs font-bold text-[#445048] transition hover:border-[#b9d1c0] hover:text-[#176b3a]">Lakás</button> : null}
        {hasHouse && houseType ? <button type="button" onClick={() => update("propertyType", houseType)} className="rounded-full border border-[#ded8ce] bg-[#faf8f4] px-3 py-1.5 text-xs font-bold text-[#445048] transition hover:border-[#b9d1c0] hover:text-[#176b3a]">Ház</button> : null}
        <button type="button" onClick={() => update("minRooms", "3")} className="rounded-full border border-[#ded8ce] bg-[#faf8f4] px-3 py-1.5 text-xs font-bold text-[#445048] transition hover:border-[#b9d1c0] hover:text-[#176b3a]">3+ szoba</button>
        <button type="button" onClick={() => update("maxPrice", "80000000")} className="rounded-full border border-[#ded8ce] bg-[#faf8f4] px-3 py-1.5 text-xs font-bold text-[#445048] transition hover:border-[#b9d1c0] hover:text-[#176b3a]">80 M Ft alatt</button>
      </div>

      <div className="relative mb-3">
        <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#7b857e]" />
        <input
          className={`${fieldClass} pl-11 pr-11`}
          placeholder="Keresés címben, városrészben, ingatlantípusban…"
          value={filters.query}
          onChange={(event) => update("query", event.target.value)}
        />
        {filters.query ? (
          <button type="button" onClick={() => clearFilter("query")} aria-label="Keresés törlése" className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-[#7b857e] transition hover:bg-[#f0ede7] hover:text-[#263129]">
            <X size={16} />
          </button>
        ) : null}
      </div>

      <div className="md:hidden">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <p className="flex items-center gap-2 text-sm font-bold text-[#172019]"><SlidersHorizontal size={16} /> Ingatlankereső</p>
            <p className="mt-1 text-xs text-[#7c877f]">{resultCount} aktív találat</p>
          </div>
          <button type="button" onClick={resetAll} className={`text-xs font-bold text-[#176b3a] ${activeCount === 0 ? "invisible" : ""}`}>Törlés</button>
        </div>
        <div className="grid gap-2">
          <input className={fieldClass} placeholder="Hol keresel? (pl. Debrecen)" value={filters.city} onChange={(event) => update("city", event.target.value)} />
          <div className="grid grid-cols-2 gap-2">
            <select className={fieldClass} value={filters.propertyType} onChange={(event) => update("propertyType", event.target.value)}><option value="">Ingatlantípus</option>{options.propertyTypes.map((item) => <option key={item}>{item}</option>)}</select>
            <input className={fieldClass} type="number" min="0" inputMode="numeric" placeholder="Max. ár (Ft)" value={filters.maxPrice} onChange={(event) => update("maxPrice", event.target.value)} />
          </div>
        </div>
        <button type="button" onClick={() => setMobileOpen((value) => !value)} className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#f4f1eb] px-4 py-3 text-sm font-bold text-[#334039]">
          {mobileOpen ? "Kevesebb szűrő" : "További szűrők"}{advancedCount > 0 ? ` · ${advancedCount} aktív` : ""}<ChevronDown size={16} className={`transition ${mobileOpen ? "rotate-180" : ""}`} />
        </button>
      </div>

      <div className={`${mobileOpen ? "block" : "hidden"} mt-3 md:mt-0 md:block`}>
        <div className="mb-4 hidden items-center justify-between md:flex">
          <div><p className="text-sm font-black text-[#172019]">Részletes ingatlankereső</p><p className="mt-1 text-xs text-[#7c877f]">Állítsd be a számodra fontos feltételeket.</p></div>
          <span className="rounded-full bg-[#edf5ef] px-3 py-1.5 text-xs font-bold text-[#176b3a]">{resultCount} találat</span>
        </div>
        <div className="hidden gap-3 md:grid md:grid-cols-2 xl:grid-cols-4">
          <input className={fieldClass} placeholder="Város" value={filters.city} onChange={(event) => update("city", event.target.value)} />
          <select className={fieldClass} value={filters.district} onChange={(event) => update("district", event.target.value)}><option value="">Minden városrész</option>{options.districts.map((item) => <option key={item}>{item}</option>)}</select>
          <select className={fieldClass} value={filters.propertyType} onChange={(event) => update("propertyType", event.target.value)}><option value="">Minden ingatlantípus</option>{options.propertyTypes.map((item) => <option key={item}>{item}</option>)}</select>
          <select className={fieldClass} value={filters.condition} onChange={(event) => update("condition", event.target.value)}><option value="">Minden állapot</option>{options.conditions.map((item) => <option key={item}>{item}</option>)}</select>
        </div>
        <div className="grid gap-2 md:mt-3 md:grid-cols-2 md:gap-3 xl:grid-cols-4">
          <input className={`${fieldClass} hidden md:block`} type="number" min="0" inputMode="numeric" placeholder="Minimum ár (Ft)" value={filters.minPrice} onChange={(event) => update("minPrice", event.target.value)} />
          <input className={`${fieldClass} hidden md:block`} type="number" min="0" inputMode="numeric" placeholder="Maximum ár (Ft)" value={filters.maxPrice} onChange={(event) => update("maxPrice", event.target.value)} />
          <select className={`${fieldClass} md:hidden`} value={filters.district} onChange={(event) => update("district", event.target.value)}><option value="">Minden városrész</option>{options.districts.map((item) => <option key={item}>{item}</option>)}</select>
          <select className={`${fieldClass} md:hidden`} value={filters.condition} onChange={(event) => update("condition", event.target.value)}><option value="">Minden állapot</option>{options.conditions.map((item) => <option key={item}>{item}</option>)}</select>
          <input className={fieldClass} type="number" min="0" inputMode="numeric" placeholder="Min. alapterület (m²)" value={filters.minArea} onChange={(event) => update("minArea", event.target.value)} />
          <input className={fieldClass} type="number" min="0" inputMode="numeric" placeholder="Max. alapterület (m²)" value={filters.maxArea} onChange={(event) => update("maxArea", event.target.value)} />
        </div>
        <div className="mt-2 grid gap-2 md:mt-3 md:grid-cols-2 md:gap-3 xl:grid-cols-4">
          <select className={fieldClass} value={filters.minRooms} onChange={(event) => update("minRooms", event.target.value)}><option value="">Szobaszám</option>{[1, 2, 3, 4, 5].map((number) => <option key={number} value={number}>Legalább {number} szoba</option>)}</select>
          <select className={fieldClass} value={filters.parking} onChange={(event) => update("parking", event.target.value)}><option value="">Bármilyen parkolás</option>{options.parking.map((item) => <option key={item}>{item}</option>)}</select>
          <select className={fieldClass} value={filters.balcony} onChange={(event) => update("balcony", event.target.value)}><option value="">Erkély / terasz mindegy</option>{options.balconies.map((item) => <option key={item}>{item}</option>)}</select>
          <select className={fieldClass} value={filters.heating} onChange={(event) => update("heating", event.target.value)}><option value="">Bármilyen fűtés</option>{options.heating.map((item) => <option key={item}>{item}</option>)}</select>
        </div>
        <div className="mt-2 grid gap-2 md:mt-3 md:grid-cols-[1fr_auto] md:gap-3">
          <select className={fieldClass} value={filters.sort} onChange={(event) => update("sort", event.target.value)}><option value="featured">Kiemeltek elöl</option><option value="newest">Legújabb elöl</option><option value="priceAsc">Ár szerint növekvő</option><option value="priceDesc">Ár szerint csökkenő</option></select>
          <button type="button" onClick={resetAll} className="hidden items-center justify-center gap-2 rounded-2xl border border-[#ded8ce] bg-[#faf8f4] px-5 py-3.5 text-sm font-semibold text-[#59645d] transition hover:border-[#b9d1c0] hover:text-[#176b3a] md:inline-flex"><RotateCcw size={16} /> Szűrők törlése</button>
        </div>

        <button type="button" onClick={() => { setMobileOpen(false); onShowResults(); }} className="mt-3 inline-flex w-full items-center justify-center rounded-2xl bg-[#176b3a] px-5 py-3.5 text-sm font-black text-white shadow-sm transition hover:bg-[#115b30] md:hidden">
          {resultCount} találat mutatása
        </button>
      </div>

      {activeChips.length > 0 ? (
        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-[#eee8df] pt-4">
          <span className="mr-1 text-xs font-bold text-[#7c877f]">Aktív szűrők:</span>
          {activeChips.map((chip) => (
            <button key={`${chip.key}-${chip.label}`} type="button" onClick={() => clearFilter(chip.key)} className="inline-flex items-center gap-1.5 rounded-full bg-[#edf5ef] px-3 py-1.5 text-xs font-bold text-[#176b3a] transition hover:bg-[#e2efe5]" title="Szűrő törlése">
              {chip.label}<X size={13} />
            </button>
          ))}
          <button type="button" onClick={resetAll} className="ml-1 text-xs font-bold text-[#7c877f] underline decoration-[#c9c1b4] underline-offset-4 transition hover:text-[#176b3a]">Összes törlése</button>
        </div>
      ) : null}
    </div>
  );
}
