"use client";

import { useEffect, useState } from "react";

import { doc, getDoc } from "firebase/firestore";

import { db } from "@/app/lib/firebase";

import { useParams } from "next/navigation";

interface Property {
  id: string;
  title: string;
  city: string;
  price: number;
  description: string;

  imageUrl: string;
  images: string[];

  phone?: string;
  email?: string;

  lat?: number;
  lng?: number;
}

export default function PropertyPage() {

  const params = useParams();

  const [property, setProperty] =
    useState<Property | null>(null);

  useEffect(() => {

    const fetchProperty = async () => {

      if (!params?.id) return;

      try {

        const docRef = doc(
          db,
          "posts",
          params.id as string
        );

        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {

          setProperty({
            id: docSnap.id,
            ...docSnap.data(),
          } as Property);

        } else {

          console.log("Nincs ilyen ingatlan");

        }

      } catch (error) {

        console.error(error);

      }

    };

    fetchProperty();

  }, [params]);

  if (!property) {

    return (
      <div
        className="
          min-h-screen
          flex
          items-center
          justify-center
          bg-black
          text-white
          text-2xl
        "
      >
        Betöltés...
      </div>
    );

  }

  return (
    <div
      className="
        min-h-screen
        bg-black
        text-white
        p-6
      "
    >

      <div
        className="
          mx-auto
          max-w-6xl
        "
      >

        {/* MAIN IMAGE */}
        <img
          src={property.imageUrl}
          alt={property.title}
          className="
            h-[500px]
            w-full
            rounded-3xl
            object-cover
            border border-zinc-800
          "
        />

        {/* GALLERY */}
        {property.images &&
          property.images.length > 1 && (

          <div
            className="
              mt-6
              grid
              gap-4
              sm:grid-cols-2
              md:grid-cols-3
            "
          >

            {property.images.map(
              (image, index) => (

                <img
                  key={index}
                  src={image}
                  alt="gallery"
                  className="
                    h-48
                    w-full
                    rounded-2xl
                    object-cover
                    border border-zinc-800
                  "
                />

              )
            )}

          </div>

        )}

        {/* CONTENT */}
        <div className="mt-10">

          <h1
            className="
              text-5xl
              font-black
            "
          >
            {property.title}
          </h1>

          <p
            className="
              mt-3
              text-xl
              text-zinc-400
            "
          >
            📍 {property.city}
          </p>

          <p
            className="
              mt-6
              text-4xl
              font-bold
              text-yellow-400
            "
          >
            {property.price.toLocaleString()} Ft
          </p>

          <div
            className="
              mt-8
              rounded-3xl
              border border-zinc-800
              bg-zinc-900
              p-8
            "
          >

            <h2
              className="
                mb-4
                text-2xl
                font-bold
              "
            >
              Leírás
            </h2>

            <p
              className="
                leading-8
                text-zinc-300
              "
            >
              {property.description}
            </p>

          </div>

          {/* CONTACT */}
          <div
            className="
              mt-8
              flex
              flex-wrap
              gap-4
            "
          >

            {property.phone && (
              <a
                href={`tel:${property.phone}`}
                className="
                  rounded-2xl
                  bg-green-500
                  px-6
                  py-4
                  font-bold
                  text-white
                  transition
                  hover:bg-green-400
                "
              >
                📞 Hívás
              </a>
            )}

            {property.email && (
              <a
                href={`mailto:${property.email}`}
                className="
                  rounded-2xl
                  bg-blue-500
                  px-6
                  py-4
                  font-bold
                  text-white
                  transition
                  hover:bg-blue-400
                "
              >
                ✉️ Email
              </a>
            )}

          </div>

        </div>

      </div>

    </div>
  );
}