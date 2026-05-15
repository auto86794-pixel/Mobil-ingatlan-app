"use client";

import { useState } from "react";

import dynamic from "next/dynamic";

import { useRouter } from "next/navigation";

import {
  db,
  storage,
  auth,
} from "../lib/firebase";

import {
  collection,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";

import {
  ref,
  uploadBytes,
  getDownloadURL,
} from "firebase/storage";

// MAP
const MapPicker = dynamic(
  () =>
    import(
      "@/app/components/map/MapPicker"
    ),
  {
    ssr: false,
  }
);

export default function Create() {

  const router = useRouter();

  // FORM
  const [title, setTitle] =
    useState("");

  const [city, setCity] =
    useState("");

  const [price, setPrice] =
    useState("");

  const [
    description,
    setDescription,
  ] = useState("");

  // CONTACT
  const [phone, setPhone] =
    useState("");

  const [email, setEmail] =
    useState("");

  // MAP
  const [lat, setLat] =
    useState(47.5316);

  const [lng, setLng] =
    useState(21.6273);

  // IMAGES
  const [images, setImages] =
    useState<string[]>([]);

  // LOADING
  const [uploading, setUploading] =
    useState(false);

  // IMAGE UPLOAD
  const handleImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {

    const files = e.target.files;

    if (!files) return;

    try {

      setUploading(true);

      const uploadedUrls: string[] =
        [];

      for (const file of Array.from(
        files
      )) {

        const safeName =
          `${Date.now()}-${Math.random()
            .toString(36)
            .substring(2)}-${file.name}`;

        const imageRef = ref(
          storage,
          `properties/${safeName}`
        );

        // UPLOAD
        await uploadBytes(
          imageRef,
          file
        );

        // URL
        const downloadURL =
          await getDownloadURL(
            imageRef
          );

        uploadedUrls.push(
          downloadURL
        );

      }

      // SAVE IMAGES
      setImages((prev) => [
        ...prev,
        ...uploadedUrls,
      ]);

    } catch (err) {

      console.error(err);

      alert(
        "Hiba a képfeltöltés során 😢"
      );

    } finally {

      setUploading(false);

    }

  };

  // SUBMIT
  const handleSubmit = async () => {

    try {

      await addDoc(
        collection(db, "posts"),
        {
          title,

          city,

          price: Number(price),

          description,

          // CONTACT
          phone,
          email,

          // COVER IMAGE
          imageUrl:
            images[0] || "",

          // ALL IMAGES
          images,

          // USER
          userId:
            auth.currentUser
              ?.uid || null,

          // DATE
          createdAt:
            serverTimestamp(),

          // MAP
          lat,
          lng,
        }
      );

      alert(
        "Ingatlan feltöltve 🚀"
      );

      router.push("/dashboard");

    } catch (err) {

      console.error(err);

      alert(
        "Hiba történt 😢"
      );

    }

  };

  return (
    <div
      className="
        flex
        min-h-screen
        items-center
        justify-center
        bg-black
        p-6
        text-white
      "
    >

      <div
        className="
          w-full
          max-w-2xl
          rounded-[32px]
          border border-zinc-800
          bg-zinc-900
          p-8
          shadow-2xl
        "
      >

        {/* HEADER */}
        <div className="mb-8">

          <h1
            className="
              text-4xl
              font-black
              tracking-tight
            "
          >
            ➕ Új ingatlan
          </h1>

          <p
            className="
              mt-2
              text-zinc-400
            "
          >
            Modern prémium ingatlan
            feltöltés.
          </p>

        </div>

        {/* TITLE */}
        <div className="mb-4">

          <label
            className="
              mb-2
              block
              text-sm
              text-zinc-400
            "
          >
            Ingatlan neve
          </label>

          <input
            placeholder="Modern lakás"
            value={title}
            onChange={(e) =>
              setTitle(
                e.target.value
              )
            }
            className="
              w-full
              rounded-2xl
              border border-zinc-700
              bg-zinc-800
              px-5
              py-4
              outline-none
              transition
              focus:border-yellow-500
            "
          />

        </div>

        {/* CITY */}
        <div className="mb-4">

          <label
            className="
              mb-2
              block
              text-sm
              text-zinc-400
            "
          >
            Város
          </label>

          <input
            placeholder="Debrecen"
            value={city}
            onChange={(e) =>
              setCity(
                e.target.value
              )
            }
            className="
              w-full
              rounded-2xl
              border border-zinc-700
              bg-zinc-800
              px-5
              py-4
              outline-none
              transition
              focus:border-yellow-500
            "
          />

        </div>

        {/* PRICE */}
        <div className="mb-4">

          <label
            className="
              mb-2
              block
              text-sm
              text-zinc-400
            "
          >
            Ár
          </label>

          <input
            type="number"
            placeholder="95000000"
            value={price}
            onChange={(e) =>
              setPrice(
                e.target.value
              )
            }
            className="
              w-full
              rounded-2xl
              border border-zinc-700
              bg-zinc-800
              px-5
              py-4
              outline-none
              transition
              focus:border-yellow-500
            "
          />

        </div>

        {/* DESCRIPTION */}
        <div className="mb-6">

          <label
            className="
              mb-2
              block
              text-sm
              text-zinc-400
            "
          >
            Leírás
          </label>

          <textarea
            rows={8}
            placeholder="Modern prémium lakás..."
            value={description}
            onChange={(e) =>
              setDescription(
                e.target.value
              )
            }
            className="
              w-full
              rounded-2xl
              border border-zinc-700
              bg-zinc-800
              px-5
              py-4
              outline-none
              transition
              focus:border-yellow-500
            "
          />

        </div>

        {/* PHONE */}
        <div className="mb-4">

          <label
            className="
              mb-2
              block
              text-sm
              text-zinc-400
            "
          >
            Telefonszám
          </label>

          <input
            type="text"
            placeholder="+36 30 123 4567"
            value={phone}
            onChange={(e) =>
              setPhone(
                e.target.value
              )
            }
            className="
              w-full
              rounded-2xl
              border border-zinc-700
              bg-zinc-800
              px-5
              py-4
              outline-none
              transition
              focus:border-yellow-500
            "
          />

        </div>

        {/* EMAIL */}
        <div className="mb-6">

          <label
            className="
              mb-2
              block
              text-sm
              text-zinc-400
            "
          >
            Email
          </label>

          <input
            type="email"
            placeholder="email@gmail.com"
            value={email}
            onChange={(e) =>
              setEmail(
                e.target.value
              )
            }
            className="
              w-full
              rounded-2xl
              border border-zinc-700
              bg-zinc-800
              px-5
              py-4
              outline-none
              transition
              focus:border-yellow-500
            "
          />

        </div>

        {/* IMAGE UPLOAD */}
        <div className="mb-6">

          <label
            className="
              mb-3
              block
              text-sm
              text-zinc-400
            "
          >
            Képek feltöltése
          </label>

          <input
            type="file"
            multiple
            accept="image/*"
            onChange={
              handleImageUpload
            }
            className="
              w-full
              rounded-2xl
              border border-zinc-700
              bg-zinc-900
              p-4
              text-white
            "
          />

        </div>

        {/* LOADING */}
        {uploading && (

          <div
            className="
              mb-6
              rounded-2xl
              bg-yellow-500/10
              p-4
              text-yellow-400
            "
          >
            Képek feltöltése...
          </div>

        )}

        {/* IMAGE PREVIEW */}
        {images.length > 0 && (

          <div
            className="
              mb-6
              grid
              gap-4
              sm:grid-cols-2
              md:grid-cols-3
            "
          >

            {images.map(
              (
                image,
                index
              ) => (

                <div
                  key={index}
                  className="
                    relative
                    overflow-hidden
                    rounded-2xl
                    border border-zinc-800
                    bg-zinc-900
                  "
                >

                  <img
                    src={image}
                    alt="preview"
                    className="
                      h-44
                      w-full
                      object-cover
                    "
                  />

                  {/* COVER */}
                  {index === 0 && (

                    <div
                      className="
                        absolute
                        left-3
                        top-3
                        rounded-full
                        bg-yellow-500
                        px-3
                        py-1
                        text-xs
                        font-bold
                        text-black
                      "
                    >
                      COVER
                    </div>

                  )}

                </div>

              )
            )}

          </div>

        )}

        {/* MAP */}
        <div className="mt-8">

          <h2
            className="
              mb-4
              text-2xl
              font-bold
              text-white
            "
          >
            📍 Lokáció kiválasztása
          </h2>

          <MapPicker
            lat={lat}
            lng={lng}
            setLat={setLat}
            setLng={setLng}
          />

        </div>

        {/* COORDINATES */}
        <div
          className="
            mt-4
            rounded-2xl
            border border-zinc-800
            bg-zinc-950
            p-4
            text-sm
            text-zinc-400
          "
        >
          Lat:
          {" "}
          {lat.toFixed(5)}
          {" "}
          | Lng:
          {" "}
          {lng.toFixed(5)}
        </div>

        {/* SUBMIT */}
        <button
          onClick={handleSubmit}
          disabled={uploading}
          className="
            mt-8
            w-full
            rounded-2xl
            bg-yellow-500
            px-6
            py-5
            text-lg
            font-bold
            text-black
            transition
            hover:bg-yellow-400
            disabled:opacity-50
          "
        >
          {uploading
            ? "Feltöltés..."
            : "🚀 Ingatlan létrehozása"}
        </button>

      </div>

    </div>
  );
}