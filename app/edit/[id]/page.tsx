"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import {
  db,
  storage,
} from "../../lib/firebase";

import {
  doc,
  getDoc,
  updateDoc,
} from "firebase/firestore";

import {
  ref,
  uploadBytes,
  getDownloadURL,
} from "firebase/storage";

type Post = {
  title: string;
  city: string;
  price: number;
  description?: string;

  imageUrl?: string;
  images?: string[];

  lat?: number;
  lng?: number;
};

export default function EditPropertyPage() {
  const params = useParams();
  const router = useRouter();

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  // FORM
  const [title, setTitle] = useState("");
  const [city, setCity] = useState("");
  const [price, setPrice] = useState("");

  const [description, setDescription] =
    useState("");

  // IMAGES
  const [images, setImages] = useState<
    string[]
  >([]);

  // LOAD PROPERTY
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
          const data =
            snapshot.data() as Post;

          setTitle(data.title || "");
          setCity(data.city || "");

          setPrice(
            data.price?.toString() || ""
          );

          setDescription(
            data.description || ""
          );

          // IMAGES
          if (
            data.images &&
            data.images.length > 0
          ) {
            setImages(data.images);
          } else if (data.imageUrl) {
            setImages([data.imageUrl]);
          }
        }
      } catch (err) {
        console.error(err);
        alert("Hiba betöltés közben");
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [params.id]);

  // IMAGE UPLOAD
  const handleImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = e.target.files;

    if (!files) return;

    try {
      const uploadedUrls: string[] = [];

      for (const file of Array.from(files)) {
        const safeName = `${Date.now()}-${Math.random()
          .toString(36)
          .substring(2)}-${file.name}`;

        const imageRef = ref(
          storage,
          `properties/${safeName}`
        );

        await uploadBytes(imageRef, file);

        const downloadURL =
          await getDownloadURL(imageRef);

        uploadedUrls.push(downloadURL);
      }

      setImages((prev) => [
        ...prev,
        ...uploadedUrls,
      ]);

    } catch (err) {
      console.error(err);
      alert("Hiba képfeltöltés közben");
    }
  };

  // SAVE
  const handleSave = async () => {
    try {
      setSaving(true);

      const docRef = doc(
        db,
        "posts",
        params.id as string
      );

      await updateDoc(docRef, {
        title,
        city,
        price: Number(price),

        description,

        // COVER IMAGE
        imageUrl: images[0] || "",

        // ALL IMAGES
        images,

        updatedAt: new Date(),
      });

      alert("Ingatlan frissítve 😄🔥");

      router.push("/dashboard");

    } catch (err) {
      console.error(err);
      alert("Hiba mentés közben");
    } finally {
      setSaving(false);
    }
  };

  // LOADING
  if (loading) {
    return (
      <div
        className="
          min-h-screen
          flex
          items-center
          justify-center
          bg-black
          text-white
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
        flex
        justify-center
        p-6
      "
    >

      <div
        className="
          w-full
          max-w-3xl
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
            "
          >
            ✏️ Ingatlan szerkesztése
          </h1>

          <p
            className="
              mt-2
              text-zinc-400
            "
          >
            Módosítsd az ingatlan adatait.
          </p>

        </div>

        {/* TITLE */}
        <div className="mb-4">

          <label className="mb-2 block text-zinc-400">
            Ingatlan neve
          </label>

          <input
            value={title}
            onChange={(e) =>
              setTitle(e.target.value)
            }
            className="
              w-full
              rounded-2xl
              border border-zinc-700
              bg-zinc-800
              px-5
              py-4
              outline-none
            "
          />

        </div>

        {/* CITY */}
        <div className="mb-4">

          <label className="mb-2 block text-zinc-400">
            Város
          </label>

          <input
            value={city}
            onChange={(e) =>
              setCity(e.target.value)
            }
            className="
              w-full
              rounded-2xl
              border border-zinc-700
              bg-zinc-800
              px-5
              py-4
              outline-none
            "
          />

        </div>

        {/* PRICE */}
        <div className="mb-4">

          <label className="mb-2 block text-zinc-400">
            Ár
          </label>

          <input
            type="number"
            value={price}
            onChange={(e) =>
              setPrice(e.target.value)
            }
            className="
              w-full
              rounded-2xl
              border border-zinc-700
              bg-zinc-800
              px-5
              py-4
              outline-none
            "
          />

        </div>

        {/* DESCRIPTION */}
        <div className="mb-6">

          <label className="mb-2 block text-zinc-400">
            Leírás
          </label>

          <textarea
            rows={6}
            value={description}
            onChange={(e) =>
              setDescription(e.target.value)
            }
            className="
              w-full
              rounded-2xl
              border border-zinc-700
              bg-zinc-800
              px-5
              py-4
              outline-none
            "
          />

        </div>

        {/* IMAGE UPLOAD */}
        <div className="mb-6">

          <label className="mb-3 block text-zinc-400">
            Új képek hozzáadása
          </label>

          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleImageUpload}
            className="
              w-full
              rounded-2xl
              border border-zinc-700
              bg-zinc-900
              p-4
            "
          />

        </div>

        {/* IMAGE PREVIEW */}
        {images.length > 0 && (
          <div
            className="
              mb-8
              grid
              gap-4
              sm:grid-cols-2
              md:grid-cols-3
            "
          >

            {images.map((image, index) => (
              <div
                key={index}
                className="
                  relative
                  overflow-hidden
                  rounded-2xl
                  border border-zinc-800
                "
              >

                <img
                  src={image}
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

                {/* DELETE */}
                <button
                  type="button"
                  onClick={() => {
                    const updated =
                      images.filter(
                        (_, i) =>
                          i !== index
                      );

                    setImages(updated);
                  }}
                  className="
                    absolute
                    right-3
                    top-3
                    rounded-full
                    bg-red-500
                    px-3
                    py-2
                    text-white
                  "
                >
                  ✕
                </button>

              </div>
            ))}

          </div>
        )}

        {/* SAVE BUTTON */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="
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
          {saving
            ? "Mentés..."
            : "💾 Mentés"}
        </button>

      </div>

    </div>
  );
}