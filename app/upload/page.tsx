"use client"

import { useState } from "react"
import { db } from "@/app/lib/firebase"
import { collection, addDoc } from "firebase/firestore"

export default function UploadPage() {
  const [title, setTitle] = useState("")
  const [price, setPrice] = useState("")
  const [description, setDescription] = useState("")
  const [imageUrl, setImageUrl] = useState("")
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      await addDoc(collection(db, "properties"), {
        title,
        price,
        description,
        imageUrl,
        phone,
        email,
        createdAt: Date.now(),
      })

      alert("Ingatlan sikeresen feltöltve!")

      setTitle("")
      setPrice("")
      setDescription("")
      setImageUrl("")
      setPhone("")
      setEmail("")
    } catch (error) {
      console.error(error)
      alert("Hiba történt!")
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">
        Új ingatlan feltöltése
      </h1>

      <form
        onSubmit={handleUpload}
        className="space-y-4"
      >
        <input
          type="text"
          placeholder="Cím"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full p-3 border rounded-xl"
        />

        <input
          type="text"
          placeholder="Ár"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          className="w-full p-3 border rounded-xl"
        />

        <textarea
          placeholder="Leírás"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full p-3 border rounded-xl h-32"
        />

        <input
          type="text"
          placeholder="Kép URL"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          className="w-full p-3 border rounded-xl"
        />

        <input
          type="text"
          placeholder="Telefonszám"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="w-full p-3 border rounded-xl"
        />

        <input
          type="email"
          placeholder="Email cím"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-3 border rounded-xl"
        />

        <button
          type="submit"
          className="bg-black text-white px-6 py-3 rounded-xl w-full"
        >
          Feltöltés
        </button>
      </form>
    </div>
  )
}