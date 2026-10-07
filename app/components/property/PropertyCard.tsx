"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, BedDouble, Home, Heart, MapPin, Maximize2, MessageCircle, Phone, Star } from "lucide-react";
import { useState } from "react";

import ContactModal from "../ContactModal";
import { formatPrice, normalizeHungarianPhone } from "../../lib/format";
import type { ListingPurpose } from "../../lib/types";

type PropertyCardProps = {
  id: string;
  title: string;
  city: string;
  district?: string;
  price: number;
  area?: number;
  rooms?: number;
  propertyType?: string;
  listingPurpose?: ListingPurpose;
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
  listingPurpose = "sale",
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
  const callablePhone = normalizeHungarianPhone(phone);

  return (
    <>
      <article className="do-property-card">
        <div className="do-card-image">
          <Link href={`/post/${id}`} aria-label={`${title} részletei`}><Image src={imageUrl} alt={title} fill sizes="(max-width: 640px) 100vw, (max-width: 1200px) 50vw, 25vw" className="object-cover" /></Link>
          <span className={"do-card-purpose " + (listingPurpose === "rent" ? "is-rent" : "")}>{listingPurpose === "rent" ? "Kiadó" : "Eladó"}</span>
          <button type="button" onClick={onToggleFavorite} aria-label={isFavorite ? "Eltávolítás a kedvencekből" : "Hozzáadás a kedvencekhez"} aria-pressed={isFavorite} className="do-card-heart"><Heart size={27} fill={isFavorite ? "currentColor" : "none"} /></button>
        </div>
        <div className="do-card-content">
          <p className="do-card-price">{formatPrice(price)}{listingPurpose === "rent" ? " / hó" : ""}</p>
          <h3 className="dh-listing-title"><Link href={`/post/${id}`}>{title}</Link></h3>
          <p className="do-card-location"><MapPin size={14} />{district ? `${district}, ${city}` : city}</p>
          <div className="do-card-facts">{validRooms ? <span><BedDouble size={15} />{validRooms} szoba</span> : null}{validArea ? <span><Maximize2 size={15} />{validArea} m²</span> : null}{cleanPropertyType && <span className="truncate"><Home size={15} />{cleanPropertyType}</span>}</div>
          <div className="do-card-actions"><Link href={`/post/${id}`}>Részletek <ArrowUpRight size={14} /></Link><div>{callablePhone && <a href={`tel:${callablePhone}`} aria-label="Telefonhívás"><Phone size={15} /></a>}<button type="button" onClick={() => setOpenModal(true)} aria-label="Érdeklődés az ingatlanról"><MessageCircle size={16} /></button></div></div>
        </div>
      </article>
      <ContactModal open={openModal} setOpen={setOpenModal} propertyTitle={title} propertyId={id} />
    </>
  );
}
