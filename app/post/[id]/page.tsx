"use client";

import { useEffect, useState } from "react";

import {
  doc,
  getDoc
} from "firebase/firestore";

import { db } from "@/app/lib/firebase";

import ContactModal from "@/app/components/ContactModal";

type Property = {
  id: string;
  title: string;
  city: string;
  price: number;
  imageUrl: string;
  description?: string;
  phone?: string;
  featured?: boolean;
};

type PropertyPageProps = {
  params: {
    id: string;
  };
};

export default function PropertyPage({
  params
}: PropertyPageProps) {

  const [openModal, setOpenModal] = useState(false);

  const [property, setProperty] =
    useState<Property | null>(null);

  const [loading, setLoading] =
    useState(true);

  // FETCH PROPERTY
  useEffect(() => {

    const fetchProperty = async () => {

      try {

        const docRef = doc(
          db,
          "posts",
          params.id
        );

        const snapshot = await getDoc(docRef);

        if (snapshot.exists()) {

          setProperty({
            id: snapshot.id,
            ...(snapshot.data() as Omit<
              Property,
              "id"
            >),
          });

        }

      } catch (error) {

        console.error(
          "Hiba property betöltésnél:",
          error
        );

      } finally {

        setLoading(false);

      }

    };

    fetchProperty();

  }, [params.id]);

  // LOADING
  if (loading) {

    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-white">
        Betöltés...
      </div>
    );

  }

  // NOT FOUND
  if (!property) {

    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-white">
        Az ingatlan nem található 😢
      </div>
    );

  }

  return (
    <div className="min-h-screen bg-black text-white p-6">

      <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1fr_320px]">

        {/* LEFT SIDE */}
        <div>

          {/* IMAGE */}
          <div className="overflow-hidden rounded-3xl border border-zinc-800">

            <img
              src={property.imageUrl}
              alt={property.title}
              className="h-[500px] w-full object-cover"
            />

          </div>

          {/* TITLE */}
          <div className="mt-8">

            <h1 className="text-5xl font-black tracking-tight">
              {property.title}
            </h1>

            <div className="mt-4 flex flex-wrap items-center gap-4">

              <div
                className="
                  rounded-full
                  bg-zinc-900
                  px-4
                  py-2
                  text-zinc-300
                "
              >
                📍 {property.city}
              </div>

              <div
                className="
                  rounded-full
                  bg-emerald-500
                  px-6
                  py-2
                  text-xl
                  font-bold
                  text-white
                "
              >
                {property.price.toLocaleString()} Ft
              </div>

            </div>

          </div>

          {/* DESCRIPTION */}
          <div className="mt-12">

            <h2 className="mb-5 text-3xl font-bold">
              Ingatlan leírás
            </h2>

            <p className="max-w-3xl text-lg leading-8 text-zinc-300">

              {property.description ||
                "Nincs leírás megadva."}

            </p>

          </div>

        </div>

        {/* RIGHT SIDE */}
        <div>

          {/* CONTACT CARD */}
          <div
            className="
              sticky
              top-24
              rounded-3xl
              border
              border-zinc-800
              bg-zinc-900
              p-6
              shadow-xl
            "
          >

            <h2 className="mb-6 text-3xl font-bold text-white">
              Kapcsolat
            </h2>

            <div className="flex flex-col gap-4">

              {/* HÍVÁS */}
              {property.phone && (
                <a
                  href={`tel:${property.phone}`}
                  className="
                    flex
                    items-center
                    justify-center
                    rounded-2xl
                    bg-emerald-500
                    px-5
                    py-4
                    text-lg
                    font-semibold
                    text-white
                    transition
                    hover:bg-emerald-400
                  "
                >
                  📞 Hívás
                </a>
              )}

              {/* ÜZENET */}
              <button
                onClick={() =>
                  setOpenModal(true)
                }
                className="
                  flex
                  items-center
                  justify-center
                  rounded-2xl
                  border
                  border-zinc-700
                  bg-zinc-800
                  px-5
                  py-4
                  text-lg
                  font-semibold
                  text-white
                  transition
                  hover:border-emerald-500
                  hover:bg-zinc-700
                "
              >
                ✉️ Üzenet küldése
              </button>

            </div>

          </div>

        </div>

      </div>

      {/* CONTACT MODAL */}
      <ContactModal
        open={openModal}
        setOpen={setOpenModal}
      />

    </div>
  );
}