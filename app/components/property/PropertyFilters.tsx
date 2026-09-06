"use client";

import { ChevronDown, RotateCcw, SlidersHorizontal } from "lucide-react";
import { useState } from "react";

export type SortOption = "featured" | "newest" | "priceAsc" | "priceDesc";

export type SearchFilters = {
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
};

const fieldClass =
  "w-full rounded-2xl border border-[#ded8ce] bg-white px-4 py-3.5 text-sm text-[#263129] outline-none transition placeholder:text-[#9aa29b] hover:border-[#c9c1b4] focus:border-[#176b3a]/50 focus:ring-4 focus:ring-[#176b3a]/[0.07]";

export default function PropertyFilters({ filters, setFilters, options, resultCount, onReset }: PropertyFiltersProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const update = (key: keyof SearchFilters, value: string) => setFilters({ ...filters, [key]: value } as SearchFilters);

  return (
    <div className="rounded-[28px] border border-[#e2ddd3] bg-white/95 p-4 shadow-[0_18px_55px_rgba(54,46,32,.10)] backdrop-blur-2xl md:p-5">
      <div className="flex items-center justify-between gap-3 md:hidden">
        <div>
          <p className="flex items-center gap-2 text-sm font-bold text-[#172019]"><SlidersHorizontal size={16} /> Keresési feltételek</p>
          <p className="mt-1 text-xs text-[#7c877f]">{resultCount} aktív találat</p>
        </div>
        <button type="button" onClick={() => setMobileOpen((value) => !value)} className="inline-flex items-center gap-2 rounded-2xl border border-[#ded8ce] bg-[#faf8f4] px-4 py-2.5 text-sm font-semibold text-[#263129]">
          {mobileOpen ? "Bezárás" : "Szűrők"}<ChevronDown size={16} className={`transition ${mobileOpen ? "rotate-180" : ""}`} />
        </button>
      </div>

      <div className={`${mobileOpen ? "block" : "hidden"} mt-4 md:mt-0 md:block`}>
        <div className="mb-4 hidden items-center justify-between md:flex">
          <div>
            <p className="text-sm font-black text-[#172019]">Részletes ingatlankereső</p>
            <p className="mt-1 text-xs text-[#7c877f]">Állítsd be a számodra fontos feltételeket.</p>
          </div>
          <span className="rounded-full bg-[#edf5ef] px-3 py-1.5 text-xs font-bold text-[#176b3a]">{resultCount} találat</span>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <input className={fieldClass} placeholder="Város" value={filters.city} onChange={(e) => update("city", e.target.value)} />
          <select className={fieldClass} value={filters.district} onChange={(e) => update("district", e.target.value)}><option value="">Minden városrész</option>{options.districts.map((item) => <option key={item}>{item}</option>)}</select>
          <select className={fieldClass} value={filters.propertyType} onChange={(e) => update("propertyType", e.target.value)}><option value="">Minden ingatlantípus</option>{options.propertyTypes.map((item) => <option key={item}>{item}</option>)}</select>
          <select className={fieldClass} value={filters.condition} onChange={(e) => update("condition", e.target.value)}><option value="">Minden állapot</option>{options.conditions.map((item) => <option key={item}>{item}</option>)}</select>
        </div>

        <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <input className={fieldClass} type="number" min="0" placeholder="Minimum ár (Ft)" value={filters.minPrice} onChange={(e) => update("minPrice", e.target.value)} />
          <input className={fieldClass} type="number" min="0" placeholder="Maximum ár (Ft)" value={filters.maxPrice} onChange={(e) => update("maxPrice", e.target.value)} />
          <input className={fieldClass} type="number" min="0" placeholder="Min. alapterület (m²)" value={filters.minArea} onChange={(e) => update("minArea", e.target.value)} />
          <input className={fieldClass} type="number" min="0" placeholder="Max. alapterület (m²)" value={filters.maxArea} onChange={(e) => update("maxArea", e.target.value)} />
        </div>

        <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <select className={fieldClass} value={filters.minRooms} onChange={(e) => update("minRooms", e.target.value)}><option value="">Szobaszám</option>{[1,2,3,4,5].map((n) => <option key={n} value={n}>Legalább {n} szoba</option>)}</select>
          <select className={fieldClass} value={filters.parking} onChange={(e) => update("parking", e.target.value)}><option value="">Bármilyen parkolás</option>{options.parking.map((item) => <option key={item}>{item}</option>)}</select>
          <select className={fieldClass} value={filters.balcony} onChange={(e) => update("balcony", e.target.value)}><option value="">Erkély / terasz mindegy</option>{options.balconies.map((item) => <option key={item}>{item}</option>)}</select>
          <select className={fieldClass} value={filters.heating} onChange={(e) => update("heating", e.target.value)}><option value="">Bármilyen fűtés</option>{options.heating.map((item) => <option key={item}>{item}</option>)}</select>
        </div>

        <div className="mt-3 grid gap-3 md:grid-cols-[1fr_auto]">
          <select className={fieldClass} value={filters.sort} onChange={(e) => update("sort", e.target.value)}><option value="featured">Kiemeltek elöl</option><option value="newest">Legújabb elöl</option><option value="priceAsc">Ár szerint növekvő</option><option value="priceDesc">Ár szerint csökkenő</option></select>
          <button type="button" onClick={onReset} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[#ded8ce] bg-[#faf8f4] px-5 py-3.5 text-sm font-semibold text-[#59645d] transition hover:border-[#b9d1c0] hover:text-[#176b3a]"><RotateCcw size={16} /> Szűrők törlése</button>
        </div>
      </div>
    </div>
  );
}
