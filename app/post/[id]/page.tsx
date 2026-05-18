"use client";

import { useEffect, useState } from "react";

import dynamic from "next/dynamic";

import {
  doc,
  getDoc,
} from "firebase/firestore";

import { db } from "@/app/lib/firebase";

import { useParams } from "next/navigation";

// MAP
const PropertyMap = dynamic(
  () =>
    import(
      "@/app/components/map/PropertyMap"
    ),
  {
    ssr: false,
  }
);

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

  // ACTIVE IMAGE
  const [selectedImage, setSelectedImage] =
    useState("");

  // CONTACT FORM
  const [loading, setLoading] =
    useState(false);

  useEffect(() => {

    const fetchProperty = async () => {

      if (!params?.id) return;

      try {

        const docRef = doc(
          db,
          "posts",
          params.id as string
        );

        const docSnap =
          await getDoc(docRef);

        if (docSnap.exists()) {

          const data = {
            id: docSnap.id,
            ...docSnap.data(),
          } as Property;

          setProperty(data);

          setSelectedImage(data.imageUrl);

        } else {

          console.log(
            "Nincs ilyen ingatlan"
          );

        }

      } catch (error) {

        console.error(error);

      }

    };

    fetchProperty();

  }, [params]);

  // LOADING
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
          src={selectedImage}
          alt={property.title}
          className="
            h-[500px]
            w-full
            rounded-3xl
            border border-zinc-800
            object-cover
            transition-all
            duration-300
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
              (
                image,
                index
              ) => (

                <img
                  key={index}
                  src={image}
                  alt="gallery"
                  onClick={() =>
                    setSelectedImage(image)
                  }
                  className={`
                    h-48
                    w-full
                    cursor-pointer
                    rounded-2xl
                    border
                    object-cover
                    transition
                    duration-300
                    hover:scale-[1.02]
                    ${
                      selectedImage === image
                        ? "border-yellow-500"
                        : "border-zinc-800"
                    }
                  `}
                />

              )
            )}

          </div>

        )}

        {/* CONTENT */}
        <div className="mt-10">

          {/* TITLE */}
          <h1
            className="
              text-5xl
              font-black
            "
          >
            {property.title}
          </h1>

          {/* CITY */}
          <p
            className="
              mt-3
              text-xl
              text-zinc-400
            "
          >
            📍 {property.city}
          </p>

          {/* PRICE */}
          <p
            className="
              mt-6
              text-4xl
              font-bold
              text-yellow-400
            "
          >
            {property.price.toLocaleString()}
            {" "}
            Ft
          </p>

          {/* DESCRIPTION */}
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
              flex-col
              gap-6
            "
          >

            {/* PHONE */}
            {property.phone && (

              <a
                href={`tel:${property.phone}`}
                className="
                  w-fit
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

            {/* CONTACT FORM */}
            {property.email && (

              <div
                className="
                  w-full
                  max-w-2xl
                  rounded-3xl
                  border border-zinc-800
                  bg-zinc-900
                  p-8
                "
              >

                <h2
                  className="
                    mb-6
                    text-3xl
                    font-black
                  "
                >
                  ✉️ Kapcsolatfelvétel
                </h2>

                <form
                  onSubmit={async (e) => {

                    e.preventDefault();

                    setLoading(true);

                    const formData =
                      new FormData(
                        e.currentTarget
                      );

                    const name =
                      formData.get("name");

                    const email =
                      formData.get("email");

                    const message =
                      formData.get("message");

                    try {

                      const response =
                        await fetch(
                          "/api/contact",
                          {
                            method: "POST",

                            headers: {
                              "Content-Type":
                                "application/json",
                            },

                            body: JSON.stringify({
                              name,
                              email,
                              message,

                              // PROPERTY OWNER
                              propertyEmail:
                                property.email,

                              propertyTitle:
                                property.title,
                            }),
                          }
                        );

                      const data =
                        await response.json();

                      if (!response.ok) {

                        throw new Error(
                          data.error
                        );

                      }

                      alert(
                        "Üzenet sikeresen elküldve! 🎉"
                      );

                      (
                        e.target as HTMLFormElement
                      ).reset();

                    } catch (error) {

                      console.error(error);

                      alert(
                        "Hiba történt 😢"
                      );

                    }

                    setLoading(false);

                  }}
                  className="
                    flex
                    flex-col
                    gap-4
                  "
                >

                  <input
                    type="text"
                    name="name"
                    placeholder="Név"
                    required
                    className="
                      rounded-2xl
                      border border-zinc-700
                      bg-black
                      p-4
                      text-white
                      outline-none
                    "
                  />

                  <input
                    type="email"
                    name="email"
                    placeholder="Email"
                    required
                    className="
                      rounded-2xl
                      border border-zinc-700
                      bg-black
                      p-4
                      text-white
                      outline-none
                    "
                  />

                  <textarea
                    name="message"
                    placeholder="Üzenet"
                    required
                    className="
                      min-h-[160px]
                      rounded-2xl
                      border border-zinc-700
                      bg-black
                      p-4
                      text-white
                      outline-none
                    "
                  />

                  <button
                    type="submit"
                    disabled={loading}
                    className="
                      rounded-2xl
                      bg-blue-500
                      px-6
                      py-4
                      font-bold
                      text-white
                      transition
                      hover:bg-blue-400
                      disabled:opacity-50
                    "
                  >
                    {loading
                      ? "Küldés..."
                      : "✉️ Üzenet küldése"}
                  </button>

                </form>

              </div>

            )}

          </div>

          {/* MAP */}
          {property.lat &&
            property.lng && (

            <div className="mt-10">

              <h2
                className="
                  mb-4
                  text-3xl
                  font-black
                  text-white
                "
              >
                📍 Elhelyezkedés
              </h2>

              <PropertyMap
                lat={property.lat}
                lng={property.lng}
                title={property.title}
              />

            </div>

          )}

        </div>

      </div>

    </div>
  );
}