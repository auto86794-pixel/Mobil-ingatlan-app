"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Building2, Heart, MapPin, Maximize2, MessageCircle, Phone, Star } from "lucide-react";
import { useState } from "react";

import ContactModal from "../ContactModal";

type PropertyCardProps = {
  id: string;
  title: string;
  city: string;
  district?: string;
  price: number;
  area?: number;
  rooms?: number;
  propertyType?: string;
  imageUrl: string;
  phone?: string;
  featured?: boolean;
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
  imageUrl,
  phone,
  featured = false,
  isFavorite = false,
  onToggleFavorite,
}: PropertyCardProps) {
  const [openModal, setOpenModal] = useState(false);

  return (
    <>
      <article className="group overflow-hidden rounded-[28px] border border-white/10 bg-zinc-900/75 shadow-[0_18px_60px_rgba(0,0,0,.28)] transition duration-300 hover:-translate-y-1 hover:border-emerald-400/25">
        <div className="relative h-60 overflow-hidden sm:h-64">
          <Image
            src={imageUrl}
            alt={title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
            className="object-cover transition-transform duration-700 group-hover:scale-[1.035]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/5 to-black/10" />

          <div className="absolute left-4 top-4 flex gap-2">
            {featured && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300/25 bg-emerald-400/90 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.12em] text-zinc-950 shadow-lg">
                <Star size={12} fill="currentColor" /> Kiemelt
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={onToggleFavorite}
            aria-label={isFavorite ? "Eltávolítás a kedvencekből" : "Hozzáadás a kedvencekhez"}
            className={`absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full border backdrop-blur-xl transition hover:scale-105 ${
              isFavorite
                ? "border-rose-300/30 bg-rose-500/90 text-white"
                : "border-white/15 bg-black/35 text-white hover:bg-black/50"
            }`}
          >
            <Heart size={19} fill={isFavorite ? "currentColor" : "none"} />
          </button>

          <div className="absolute inset-x-5 bottom-4 flex items-end justify-between gap-3">
            <div className="rounded-full border border-white/10 bg-black/45 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-xl">
              {propertyType || "Ingatlan"}
            </div>
            <div className="text-right text-xl font-black tracking-tight text-white drop-shadow-lg">
              {price.toLocaleString("hu-HU")} Ft
            </div>
          </div>
        </div>

        <div className="p-5 sm:p-6">
          <div className="min-h-[76px]">
            <h2 className="line-clamp-2 text-xl font-bold leading-snug tracking-tight text-white sm:text-[22px]">{title}</h2>
            <p className="mt-2 flex items-center gap-1.5 text-sm text-zinc-400">
              <MapPin size={15} className="text-emerald-400" />
              {city}{district ? `, ${district}` : ""}
            </p>
          </div>

          {(area || rooms) && (
            <div className="mt-5 flex gap-2 border-y border-white/10 py-4 text-sm text-zinc-300">
              {area ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.04] px-3 py-1.5">
                  <Maximize2 size={14} className="text-zinc-500" /> {area} m²
                </span>
              ) : null}
              {rooms ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.04] px-3 py-1.5">
                  <Building2 size={14} className="text-zinc-500" /> {rooms} szoba
                </span>
              ) : null}
            </div>
          )}

          <div className="mt-5 grid grid-cols-[1fr_auto_auto] gap-2">
            <Link
              href={`/post/${id}`}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-black text-zinc-950 transition hover:bg-emerald-400"
            >
              Részletek <ArrowUpRight size={16} />
            </Link>
            {phone && (
              <a
                href={`tel:${phone}`}
                aria-label="Telefonhívás"
                className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-zinc-200 transition hover:border-emerald-400/30 hover:text-emerald-300"
              >
                <Phone size={18} />
              </a>
            )}
            <button
              type="button"
              onClick={() => setOpenModal(true)}
              aria-label="Üzenet küldése"
              className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-zinc-200 transition hover:border-emerald-400/30 hover:text-emerald-300"
            >
              <MessageCircle size={18} />
            </button>
          </div>
        </div>
      </article>

      <ContactModal open={openModal} setOpen={setOpenModal} propertyTitle={title} />
    </>
  );
}
