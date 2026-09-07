"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, BedDouble, Heart, MapPin, Maximize2, MessageCircle, Phone, Star } from "lucide-react";
import { useState } from "react";

import ContactModal from "../ContactModal";
import { formatPrice } from "../../lib/format";

type PropertyCardProps = {
  id: string;
  title: string;
  city: string;
  district?: string;
  price: number;
  area?: number;
  rooms?: number;
  propertyType?: string;
  listingType?: "sale" | "rent";
  imageUrl: string;
  phone?: string;
  featured?: boolean;
  isNew?: boolean;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
};

export default function PropertyCard({
  id,
  title,
  city,
  district,
  price,
  area,
  rooms,
  propertyType,
  listingType,
  imageUrl,
  phone,
  featured = false,
  isNew = false,
  isFavorite = false,
  onToggleFavorite,
}: PropertyCardProps) {
  const [openModal, setOpenModal] = useState(false);

  const validArea = typeof area === "number" && Number.isFinite(area) && area > 0 ? area : null;
  const validRooms = typeof rooms === "number" && Number.isFinite(rooms) && rooms > 0 ? rooms : null;
  const cleanPropertyType = propertyType?.trim();
  const inferredPropertyType = (() => {
    if (cleanPropertyType) return cleanPropertyType;
    const value = title.toLocaleLowerCase("hu-HU");
    if (value.includes("ikerház")) return "Ikerház";
    if (value.includes("sorház")) return "Sorház";
    if (value.includes("családi ház") || value.includes("ház")) return "Családi ház";
    if (value.includes("penthouse")) return "Penthouse";
    if (value.includes("lakás")) return "Lakás";
    if (value.includes("telek")) return "Telek";
    return null;
  })();

  return (
    <>
      <article className="group flex h-full flex-col overflow-hidden rounded-[26px] border border-[#e2ddd3] bg-white shadow-[0_16px_45px_rgba(54,46,32,.08)] transition duration-300 hover:-translate-y-1 hover:border-[#c7d7cb] hover:shadow-[0_20px_55px_rgba(54,46,32,.12)]">
        <div className="relative h-56 overflow-hidden sm:h-64">
          <Image src={imageUrl} alt={title} fill sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw" className="object-cover transition-transform duration-700 group-hover:scale-[1.035]" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/62 via-transparent to-black/5" />

          <div className="absolute left-4 top-4 flex gap-2">
            {featured && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#d7c48f] bg-[#fbf2d9]/95 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.12em] text-[#7e6827] shadow-lg">
                <Star size={12} fill="currentColor" /> Kiemelt
              </span>
            )}
            {isNew && (
              <span className="inline-flex items-center rounded-full border border-[#b9d1c0] bg-[#eef7f0]/95 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.12em] text-[#176b3a] shadow-lg">
                Új
              </span>
            )}
          </div>

          <button type="button" onClick={onToggleFavorite} aria-label={isFavorite ? "Eltávolítás a kedvencekből" : "Hozzáadás a kedvencekhez"} className={`absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full border backdrop-blur-xl transition duration-200 hover:scale-110 active:scale-90 ${isFavorite ? "border-rose-200 bg-white text-rose-500 shadow-lg ring-2 ring-white/70" : "border-white/60 bg-white/[0.88] text-[#263129] hover:bg-white"}`}>
            <Heart size={19} fill={isFavorite ? "currentColor" : "none"} />
          </button>

          <div className="absolute inset-x-5 bottom-4 flex items-end justify-between gap-3">
            <div className="flex gap-2"><span className="rounded-full border border-white/30 bg-white/90 px-3 py-1.5 text-xs font-black text-[#176b3a] backdrop-blur-xl">{listingType === "rent" ? "Kiadó" : "Eladó"}</span><span className="rounded-full border border-white/30 bg-white/90 px-3 py-1.5 text-xs font-bold text-[#334039] backdrop-blur-xl">{inferredPropertyType || "Ingatlan"}</span></div>
            <div className="text-right text-xl font-black tracking-tight text-white drop-shadow-lg">{formatPrice(price)}</div>
          </div>
        </div>

        <div className="flex flex-1 flex-col p-5 sm:p-6">
          <div className="min-h-[72px] sm:min-h-[82px]">
            <h2 className="line-clamp-2 text-xl font-black leading-snug tracking-tight text-[#172019] sm:text-[22px]">{title}</h2>
            <p className="mt-2 flex items-center gap-1.5 text-sm text-[#6c776f]"><MapPin size={15} className="text-[#176b3a]" />{city}{district ? `, ${district}` : ""}</p>
          </div>

          <div className="mt-5 flex min-h-[62px] items-center gap-2 border-y border-[#eee8df] py-3 text-sm text-[#4d5a51]">
            {validArea ? <span className="inline-flex items-center gap-1.5 rounded-full bg-[#f8f5ef] px-3 py-1.5"><Maximize2 size={14} className="text-[#7d887f]" /> {validArea} m²</span> : null}
            {validRooms ? <span className="inline-flex items-center gap-1.5 rounded-full bg-[#f8f5ef] px-3 py-1.5"><BedDouble size={14} className="text-[#7d887f]" /> {validRooms} szoba</span> : null}
            {!validArea && !validRooms ? <span className="text-xs font-semibold text-[#8a938c]">További adatok az ingatlan adatlapján</span> : null}
          </div>

          <div className="mt-auto grid grid-cols-[1fr_auto_auto] gap-2 pt-5">
            <Link href={`/post/${id}`} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#176b3a] px-4 py-3 text-sm font-black text-white transition hover:bg-[#115b30]">Részletek <ArrowUpRight size={16} /></Link>
            {phone && <a href={`tel:${phone}`} aria-label="Telefonhívás" className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-[#ded8ce] bg-[#faf8f4] text-[#445048] transition hover:border-[#b9d1c0] hover:text-[#176b3a]"><Phone size={18} /></a>}
            <button type="button" onClick={() => setOpenModal(true)} aria-label="Üzenet küldése" className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-[#ded8ce] bg-[#faf8f4] text-[#445048] transition hover:border-[#b9d1c0] hover:text-[#176b3a]"><MessageCircle size={18} /></button>
          </div>
        </div>
      </article>
      <ContactModal open={openModal} setOpen={setOpenModal} propertyTitle={title} propertyId={id} />
    </>
  );
}
