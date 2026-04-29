"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import dynamic from "next/dynamic";

import { db } from "../../lib/firebase";
import { doc, getDoc } from "firebase/firestore";

import Navbar from "../../components/Navbar";
import MobileBottomNav from "../../components/MobileBottomNav";

// MAP IMPORT
const PropertyMap = dynamic(
  () => import("../../components/map/PropertyMap"),
  {
    ssr: false,
  }
);

type Post = {
  id: string;
  title: string;
  city: string;
  price: number;
  imageUrl: string;

  images?: string[];

  size?: number;
  rooms?: number;
  bathrooms?: number;
  garage?: boolean;
  floor?: number;
  landSize?: number;

  lat?: number;
  lng?: number;

  description?: string;
};

export default function PropertyDetailPage() {
  const params = useParams();

  const [post, setPost] = useState<Post | null>(null);

  const [loading, setLoading] = useState(true);

  const [selectedImage, setSelectedImage] =
    useState("");

  const [lightboxOpen, setLightboxOpen] =
    useState(false);

  // FETCH PROPERTY
  useEffect(() => {
    const fetchPost = async () => {
      try {
        const docRef = doc(
          db,
          "posts",
          params.id as string
        );

        const snapshot = await getDoc(docRef);

        if (snapshot.exists()) {
          const data = {
            id: snapshot.id,
            ...(snapshot.data() as Omit<Post, "id">),
          };

          setPost(data);

          setSelectedImage(
            data.images?.[0] || data.imageUrl
          );
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [params.id]);

  // LOADING
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        Betöltés...
      </div>
    );
  }

  // NOT FOUND
  if (!post) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        Az ingatlan nem található.
      </div>
    );
  }

  return (
    <>
      
      <MobileBottomNav />

      <main className="min-h-screen bg-black text-white">

        {/* GALLERY */}
        <section className="mx-auto max-w-7xl px-6 pt-10">

          {/* BACK BUTTON */}
          <button
            onClick={() => history.back()}
            className="
              mb-6
              text-zinc-400
              transition
              hover:text-white
            "
          >
            ← Vissza
          </button>

          <div className="grid gap-5 lg:grid-cols-5">

            {/* MAIN IMAGE */}
            <div className="lg:col-span-4">

              <div
                className="
                  overflow-hidden
                  rounded-[32px]
                  border border-zinc-800
                  bg-zinc-900
                "
              >

                <img
                  src={selectedImage}
                  onClick={() =>
                    setLightboxOpen(true)
                  }
                  className="
                    h-[65vh]
                    w-full
                    cursor-zoom-in
                    object-cover
                    transition
                    duration-500
                    hover:scale-[1.02]
                  "
                />

              </div>

            </div>

            {/* THUMBNAILS */}
            <div
              className="
                flex
                gap-4
                overflow-x-auto
                lg:flex-col
              "
            >

              {(post.images?.length
                ? post.images
                : [post.imageUrl]
              ).map((image, index) => (
                <button
                  key={index}
                  onClick={() =>
                    setSelectedImage(image)
                  }
                  className={`
                    overflow-hidden
                    rounded-2xl
                    border-2
                    transition-all
                    min-w-[110px]
                    lg:min-w-0

                    ${
                      selectedImage === image
                        ? "border-yellow-500 scale-105"
                        : "border-zinc-800 opacity-70 hover:opacity-100"
                    }
                  `}
                >

                  <img
                    src={image}
                    className="
                      h-28
                      w-full
                      object-cover
                    "
                  />

                </button>
              ))}

            </div>

          </div>

        </section>

        {/* CONTENT */}
        <section
          className="
            mx-auto
            max-w-7xl
            px-6
            py-14
            pb-32
            md:pb-14
          "
        >

          <div className="grid gap-10 lg:grid-cols-3">

            {/* LEFT COLUMN */}
            <div className="lg:col-span-2">

              <div
                className="
                  rounded-3xl
                  border border-zinc-800
                  bg-zinc-900
                  p-8
                "
              >

                {/* TITLE */}
                <h1
                  className="
                    mb-3
                    text-5xl
                    font-black
                    tracking-tight
                  "
                >
                  {post.title}
                </h1>

                {/* LOCATION + PRICE */}
                <div
                  className="
                    mb-6
                    flex
                    flex-wrap
                    items-center
                    gap-4
                  "
                >

                  <div
                    className="
                      rounded-2xl
                      border border-zinc-800
                      bg-zinc-800
                      px-4
                      py-2
                      text-zinc-300
                    "
                  >
                    📍 {post.city}
                  </div>

                  <div
                    className="
                      rounded-2xl
                      bg-yellow-500
                      px-5
                      py-2
                      font-bold
                      text-black
                    "
                  >
                    {post.price.toLocaleString()} Ft
                  </div>

                </div>

                {/* STATS */}
                <div
                  className="
                    mb-8
                    grid
                    gap-4
                    sm:grid-cols-2
                    lg:grid-cols-3
                  "
                >

                  <div
                    className="
                      rounded-2xl
                      border border-zinc-800
                      bg-zinc-800/60
                      p-5
                    "
                  >
                    <p className="text-sm text-zinc-500">
                      Alapterület
                    </p>

                    <h3 className="mt-2 text-2xl font-bold">
                      {post.size || 94} m²
                    </h3>
                  </div>

                  <div
                    className="
                      rounded-2xl
                      border border-zinc-800
                      bg-zinc-800/60
                      p-5
                    "
                  >
                    <p className="text-sm text-zinc-500">
                      Szobák
                    </p>

                    <h3 className="mt-2 text-2xl font-bold">
                      {post.rooms || 3}
                    </h3>
                  </div>

                  <div
                    className="
                      rounded-2xl
                      border border-zinc-800
                      bg-zinc-800/60
                      p-5
                    "
                  >
                    <p className="text-sm text-zinc-500">
                      Fürdőszobák
                    </p>

                    <h3 className="mt-2 text-2xl font-bold">
                      {post.bathrooms || 2}
                    </h3>
                  </div>

                  <div
                    className="
                      rounded-2xl
                      border border-zinc-800
                      bg-zinc-800/60
                      p-5
                    "
                  >
                    <p className="text-sm text-zinc-500">
                      Garázs
                    </p>

                    <h3 className="mt-2 text-2xl font-bold">
                      {post.garage
                        ? "Van"
                        : "Nincs"}
                    </h3>
                  </div>

                  <div
                    className="
                      rounded-2xl
                      border border-zinc-800
                      bg-zinc-800/60
                      p-5
                    "
                  >
                    <p className="text-sm text-zinc-500">
                      Emelet
                    </p>

                    <h3 className="mt-2 text-2xl font-bold">
                      {post.floor || 1}
                    </h3>
                  </div>

                  <div
                    className="
                      rounded-2xl
                      border border-zinc-800
                      bg-zinc-800/60
                      p-5
                    "
                  >
                    <p className="text-sm text-zinc-500">
                      Telek
                    </p>

                    <h3 className="mt-2 text-2xl font-bold">
                      {post.landSize || 420} m²
                    </h3>
                  </div>

                </div>

                {/* DESCRIPTION */}
                <h2
                  className="
                    mb-6
                    text-2xl
                    font-bold
                  "
                >
                  Ingatlan leírás
                </h2>

                <p
                  className="
                    leading-8
                    text-zinc-300
                  "
                >
                  {post.description ||
                    "Modern prémium ingatlan kiváló lokációval, modern kialakítással és exkluzív megjelenéssel."}
                </p>

                {/* MAP */}
                <div className="mt-10">

                  <h2
                    className="
                      mb-6
                      text-3xl
                      font-bold
                    "
                  >
                    📍 Lokáció
                  </h2>

                  <PropertyMap
                    lat={post.lat || 47.5316}
                    lng={post.lng || 21.6273}
                    title={post.title}
                    city={post.city}
                  />

                </div>

              </div>

            </div>

            {/* RIGHT SIDEBAR */}
            <div>

              <div
                className="
                  sticky
                  top-28
                  rounded-3xl
                  border border-zinc-800
                  bg-zinc-900
                  p-6
                "
              >

                <h3
                  className="
                    mb-5
                    text-2xl
                    font-bold
                  "
                >
                  Kapcsolat
                </h3>

                <button
                  className="
                    mb-3
                    w-full
                    rounded-2xl
                    bg-yellow-500
                    px-5
                    py-4
                    font-semibold
                    text-black
                    transition
                    hover:bg-yellow-400
                  "
                >
                  📞 Hívás
                </button>

                <button
                  className="
                    w-full
                    rounded-2xl
                    border border-zinc-700
                    bg-zinc-800
                    px-5
                    py-4
                    text-white
                    transition
                    hover:border-yellow-500
                  "
                >
                  ✉️ Üzenet küldése
                </button>

              </div>

            </div>

          </div>

        </section>

        {/* LIGHTBOX */}
        {lightboxOpen && (
          <div
            className="
              fixed
              inset-0
              z-[999]
              flex
              items-center
              justify-center
              bg-black/95
              backdrop-blur-xl
            "
          >

            <button
              onClick={() =>
                setLightboxOpen(false)
              }
              className="
                absolute
                right-6
                top-6
                z-10
                rounded-full
                bg-white/10
                px-4
                py-2
                text-white
                backdrop-blur-xl
                transition
                hover:bg-white/20
              "
            >
              ✕
            </button>

            <img
              src={selectedImage}
              className="
                max-h-[90vh]
                max-w-[92vw]
                rounded-3xl
                object-contain
                shadow-2xl
              "
            />

          </div>
        )}

      </main>
    </>
  );
}