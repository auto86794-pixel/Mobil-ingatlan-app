"use client";

import { useState } from "react";

import Image from "next/image";
import Link from "next/link";

import ContactModal from "../ContactModal";

type PropertyCardProps = {
  id: string;
  title: string;
  city: string;
  price: number;
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
  price,
  imageUrl,
  phone,
  featured = false,
  isFavorite = false,
  onToggleFavorite,
}: PropertyCardProps) {

  const [openModal, setOpenModal] =
    useState(false);

  return (
    <>
      <div
        className={`
          group
          relative
          overflow-hidden
          rounded-3xl
          border
          bg-zinc-900
          transition-all
          duration-300
          hover:-translate-y-1
          hover:shadow-2xl

          ${
            isFavorite
              ? "border-pink-500/40 shadow-pink-500/10"
              : "border-zinc-800 hover:border-emerald-500/40 hover:shadow-emerald-500/10"
          }
        `}
      >

        {/* IMAGE */}
        <div className="relative h-56 overflow-hidden md:h-64">

          <Image
            src={imageUrl}
            alt={title}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="
              object-cover
              transition-transform
              duration-500
              group-hover:scale-105
            "
          />

          {/* OVERLAY */}
          <div
            className="
              absolute
              inset-0
              bg-gradient-to-t
              from-black/80
              via-black/20
              to-transparent
            "
          />

          {/* FEATURED BADGE */}
          {featured && (
            <div
              className="
                absolute
                left-4
                top-4
                rounded-full
                bg-emerald-500
                px-3
                py-1
                text-xs
                font-semibold
                text-white
                shadow-lg
              "
            >
              KIEMELT
            </div>
          )}

          {/* FAVORITE BADGE */}
          {isFavorite && (
            <div
              className="
                absolute
                left-4
                bottom-4
                rounded-full
                bg-yellow-500
                px-3
                py-1
                text-xs
                font-bold
                text-white
                shadow-lg
              "
            >
              ❤️ Kedvenc
            </div>
          )}

          {/* FAVORITE BUTTON */}
          <button
            onClick={onToggleFavorite}
            className="
              absolute
              right-4
              top-4
              flex
              h-11
              w-11
              items-center
              justify-center
              rounded-full
              bg-black/40
              backdrop-blur-md
              transition
              hover:scale-110
            "
          >

            <span className="text-2xl">
              {isFavorite
                ? "❤️"
                : "🤍"}
            </span>

          </button>

        </div>

        {/* CONTENT */}
        <div className="p-6">

          {/* TITLE + CITY */}
          <div className="mb-5">

            <h2
              className="
                text-2xl
                font-bold
                tracking-tight
                text-white
              "
            >
              {title}
            </h2>

            <p className="mt-2 text-sm text-zinc-400">
              📍 {city}
            </p>

          </div>

          {/* PRICE */}
          <div className="mb-6">

            <p
              className="
                text-lg
                font-medium
                tracking-normal
                text-emerald-400
              "
            >
              {price.toLocaleString()} Ft
            </p>

          </div>

          {/* ACTIONS */}
          <div className="flex flex-wrap gap-3">

            {/* VIEW */}
            <Link
              href={`/post/${id}`}
              className="
                inline-flex
                items-center
                justify-center
                rounded-2xl
                bg-emerald-500
                px-5
                py-3
                text-xs
                font-semibold
                uppercase
                tracking-wide
                text-white
                transition-all
                duration-300
                hover:bg-emerald-400
                hover:shadow-lg
                hover:shadow-emerald-500/20
              "
            >
              Megnézem
            </Link>

            {/* PHONE */}
            {phone && (
              <a
                href={`tel:${phone}`}
                className="
                  inline-flex
                  items-center
                  justify-center
                  rounded-2xl
                  border border-zinc-700
                  bg-zinc-800
                  px-5
                  py-3
                  text-xs
                  font-semibold
                  uppercase
                  tracking-wide
                  text-white
                  transition-all
                  duration-300
                  hover:border-emerald-500
                  hover:bg-zinc-700
                "
              >
                📞 Hívás
              </a>
            )}

            {/* MESSAGE */}
            <button
              onClick={() =>
                setOpenModal(true)
              }
              className="
                inline-flex
                items-center
                justify-center
                rounded-2xl
                border border-zinc-700
                bg-zinc-800
                px-5
                py-3
                text-xs
                font-semibold
                uppercase
                tracking-wide
                text-white
                transition-all
                duration-300
                hover:border-emerald-500
                hover:bg-zinc-700
              "
            >
              💬 Üzenet
            </button>

          </div>

        </div>

      </div>

      {/* CONTACT MODAL */}
      <ContactModal
        open={openModal}
        setOpen={setOpenModal}
      />
    </>
  );
}