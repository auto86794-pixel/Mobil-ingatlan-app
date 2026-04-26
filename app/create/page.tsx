"use client";

import { useState } from "react";
import { db, storage, auth } from "../lib/firebase";
import { collection, addDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useRouter } from "next/navigation";

export default function Create() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [city, setCity] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState<File | null>(null);

  const handleSubmit = async () => {
    try {
      let imageUrl = "";

      if (image) {
        const safeName = `${Date.now()}-${Math.random()
          .toString(36)
          .substring(2)}.jpg`;

        const imageRef = ref(storage, `images/${safeName}`);

        await uploadBytes(imageRef, image);
        imageUrl = await getDownloadURL(imageRef);
      }

      await addDoc(collection(db, "posts"), {
        title,
        city,
        price: Number(price),
        description,
        imageUrl,
        userId: auth.currentUser?.uid,
        createdAt: new Date(),
      });

      alert("Ingatlan feltöltve! 🚀");

      router.push("/dashboard");
    } catch (err) {
      console.error(err);
      alert("Hiba történt");
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white flex justify-center items-center">
      <div className="bg-gray-900 p-6 rounded-2xl w-full max-w-md shadow-xl">

        <h1 className="text-2xl font-bold mb-4">➕ Új ingatlan</h1>

        <input
          placeholder="Cím"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full mb-2 p-2 bg-gray-800 rounded"
        />

        <input
          placeholder="Város"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          className="w-full mb-2 p-2 bg-gray-800 rounded"
        />

        <input
          placeholder="Ár"
          type="number"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          className="w-full mb-2 p-2 bg-gray-800 rounded"
        />

        <textarea
          placeholder="Leírás"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full mb-2 p-2 bg-gray-800 rounded"
        />

        <input
          type="file"
          onChange={(e) =>
            setImage(e.target.files ? e.target.files[0] : null)
          }
          className="mb-4"
        />

        <button
          onClick={handleSubmit}
          className="bg-green-600 w-full p-2 rounded hover:bg-green-700"
        >
          Mentés
        </button>
      </div>
    </div>
  );
}