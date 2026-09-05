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
  "w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3.5 text-sm text-white outline-none transition placeholder:text-zinc-600 hover:border-white/15 focus:border-emerald-400/50 focus:ring-2 focus:ring-emerald-400/10";

export default function PropertyFilters({ filters, setFilters, options, resultCount, onReset }: PropertyFiltersProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const update = (key: keyof SearchFilters, value: string) => setFilters({ ...filters, [key]: value } as SearchFilters);

  return (
    <div className="rounded-[28px] border border-white/10 bg-zinc-950/75 p-4 shadow-2xl shadow-black/30 backdrop-blur-2xl md:p-5">
      <div className="flex items-center justify-between gap-3 md:hidden">
        <div>
          <p className="flex items-center gap-2 text-sm font-bold text-white"><SlidersHorizontal size={16} /> Keresési feltételek</p>
          <p className="mt-1 text-xs text-zinc-500">{resultCount} aktív találat</p>
        </div>
        <button
          type="button"
          onClick={() => setMobileOpen((value) => !value)}
          className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-semibold text-white"
        >
          {mobileOpen ? "Bezárás" : "Szűrők"}
          <ChevronDown size={16} className={`transition ${mobileOpen ? "rotate-180" : ""}`} />
        </button>
      </div>

      <div className={`${mobileOpen ? "block" : "hidden"} mt-4 md:mt-0 md:block`}>
        <div className="mb-4 hidden items-center justify-between md:flex">
          <div>
            <p className="text-sm font-black text-white">Részletes ingatlankereső</p>
            <p className="mt-1 text-xs text-zinc-500">Állítsd be a számodra fontos feltételeket.</p>
          </div>
          <span className="rounded-full bg-emerald-400/10 px-3 py-1.5 text-xs font-bold text-emerald-300">{resultCount} találat</span>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <input className={fieldClass} placeholder="Város" value={filters.city} onChange={(e) => update("city", e.target.value)} />
          <select className={fieldClass} value={filters.district} onChange={(e) => update("district", e.target.value)}>
            <option value="">Minden városrész</option>{options.districts.map((item) => <option key={item}>{item}</option>)}
          </select>
          <select className={fieldClass} value={filters.propertyType} onChange={(e) => update("propertyType", e.target.value)}>
            <option value="">Minden ingatlantípus</option>{options.propertyTypes.map((item) => <option key={item}>{item}</option>)}
          </select>
          <select className={fieldClass} value={filters.condition} onChange={(e) => update("condition", e.target.value)}>
            <option value="">Minden állapot</option>{options.conditions.map((item) => <option key={item}>{item}</option>)}
          </select>
        </div>

        <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <input className={fieldClass} type="number" min="0" placeholder="Minimum ár (Ft)" value={filters.minPrice} onChange={(e) => update("minPrice", e.target.value)} />
          <input className={fieldClass} type="number" min="0" placeholder="Maximum ár (Ft)" value={filters.maxPrice} onChange={(e) => update("maxPrice", e.target.value)} />
          <input className={fieldClass} type="number" min="0" placeholder="Min. alapterület (m²)" value={filters.minArea} onChange={(e) => update("minArea", e.target.value)} />
          <input className={fieldClass} type="number" min="0" placeholder="Max. alapterület (m²)" value={filters.maxArea} onChange={(e) => update("maxArea", e.target.value)} />
        </div>

        <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <select className={fieldClass} value={filters.minRooms} onChange={(e) => update("minRooms", e.target.value)}>
            <option value="">Szobaszám</option>
            {[1,2,3,4,5].map((n) => <option key={n} value={n}>Legalább {n} szoba</option>)}
          </select>
          <select className={fieldClass} value={filters.parking} onChange={(e) => update("parking", e.target.value)}>
            <option value="">Bármilyen parkolás</option>{options.parking.map((item) => <option key={item}>{item}</option>)}
          </select>
          <select className={fieldClass} value={filters.balcony} onChange={(e) => update("balcony", e.target.value)}>
            <option value="">Erkély / terasz mindegy</option>{options.balconies.map((item) => <option key={item}>{item}</option>)}
          </select>
          <select className={fieldClass} value={filters.heating} onChange={(e) => update("heating", e.target.value)}>
            <option value="">Bármilyen fűtés</option>{options.heating.map((item) => <option key={item}>{item}</option>)}
          </select>
        </div>

        <div className="mt-3 grid gap-3 md:grid-cols-[1fr_auto]">
          <select className={fieldClass} value={filters.sort} onChange={(e) => update("sort", e.target.value)}>
            <option value="featured">Kiemeltek elöl</option>
            <option value="newest">Legújabb elöl</option>
            <option value="priceAsc">Ár szerint növekvő</option>
            <option value="priceDesc">Ár szerint csökkenő</option>
          </select>
          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-3.5 text-sm font-semibold text-zinc-300 transition hover:border-emerald-400/30 hover:text-white"
          >
            <RotateCcw size={16} /> Szűrők törlése
          </button>
        </div>
      </div>
    </div>
  );
}
