"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, type User } from "firebase/auth";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";

import { auth, db, storage } from "../lib/firebase";
import type { PropertyStatus } from "../lib/types";

const MapPicker = dynamic(() => import("@/app/components/map/MapPicker"), { ssr: false });

const inputClass = "w-full rounded-2xl border border-zinc-700 bg-zinc-800 px-5 py-4 outline-none transition focus:border-yellow-500";

export default function Create() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [title, setTitle] = useState("");
  const [city, setCity] = useState("Debrecen");
  const [district, setDistrict] = useState("");
  const [price, setPrice] = useState("");
  const [propertyType, setPropertyType] = useState("lakás");
  const [area, setArea] = useState("");
  const [rooms, setRooms] = useState("");
  const [condition, setCondition] = useState("");
  const [floor, setFloor] = useState("");
  const [balcony, setBalcony] = useState("");
  const [parking, setParking] = useState("");
  const [heating, setHeating] = useState("");
  const [status, setStatus] = useState<PropertyStatus>("active");
  const [description, setDescription] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [lat, setLat] = useState(47.5316);
  const [lng, setLng] = useState(21.6273);
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        router.replace("/login");
        return;
      }
      setUser(currentUser);
      setEmail((current) => current || currentUser.email || "");
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, [router]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !user) return;
    try {
      setUploading(true);
      const uploadedUrls: string[] = [];
      for (const file of Array.from(files)) {
        const safeName = `${Date.now()}-${Math.random().toString(36).substring(2)}-${file.name}`;
        const imageRef = ref(storage, `properties/${user.uid}/${safeName}`);
        await uploadBytes(imageRef, file);
        uploadedUrls.push(await getDownloadURL(imageRef));
      }
      setImages((prev) => [...prev, ...uploadedUrls]);
    } catch (err) {
      console.error(err);
      alert("Hiba a képfeltöltés során.");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!user) return router.replace("/login");
    if (!title.trim() || !city.trim() || !price || !area || !rooms) {
      alert("A cím, város, ár, alapterület és szobaszám megadása kötelező.");
      return;
    }
    try {
      setSaving(true);
      await addDoc(collection(db, "posts"), {
        title: title.trim(),
        city: city.trim(),
        district: district.trim(),
        price: Number(price),
        propertyType,
        area: Number(area),
        rooms: Number(rooms),
        condition: condition.trim(),
        floor: floor.trim(),
        balcony: balcony.trim(),
        parking: parking.trim(),
        heating: heating.trim(),
        description: description.trim(),
        phone: phone.trim(),
        email: email.trim(),
        imageUrl: images[0] || "",
        images,
        userId: user.uid,
        featured: false,
        status,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lat,
        lng,
      });
      alert("Ingatlan feltöltve 🚀");
      router.push("/dashboard");
    } catch (err) {
      console.error(err);
      alert("Hiba történt a mentés során.");
    } finally {
      setSaving(false);
    }
  };

  if (authLoading) {
    return <div className="flex min-h-screen items-center justify-center bg-black text-white">Bejelentkezés ellenőrzése...</div>;
  }

  const field = (label: string, value: string, setter: (v: string) => void, placeholder = "", type = "text") => (
    <div className="mb-4">
      <label className="mb-2 block text-sm text-zinc-400">{label}</label>
      <input type={type} placeholder={placeholder} value={value} onChange={(e) => setter(e.target.value)} className={inputClass} />
    </div>
  );

  return (
    <div className="flex min-h-screen items-center justify-center bg-black p-6 text-white">
      <div className="w-full max-w-3xl rounded-[32px] border border-zinc-800 bg-zinc-900 p-8 shadow-2xl">
        <div className="mb-8">
          <h1 className="text-4xl font-black tracking-tight">➕ Új ingatlan</h1>
          <p className="mt-2 text-zinc-400">Egységes DebrecenHomes ingatlan-adatlap.</p>
        </div>

        {field("Ingatlan neve", title, setTitle, "Modern lakás")}
        <div className="grid gap-4 md:grid-cols-2">
          {field("Város", city, setCity, "Debrecen")}
          {field("Városrész", district, setDistrict, "Nagyerdő")}
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {field("Ár (Ft)", price, setPrice, "95000000", "number")}
          {field("Alapterület (m²)", area, setArea, "65", "number")}
          {field("Szobák száma", rooms, setRooms, "3", "number")}
        </div>

        <div className="mb-4 grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm text-zinc-400">Ingatlantípus</label>
            <select value={propertyType} onChange={(e) => setPropertyType(e.target.value)} className={inputClass}>
              <option value="lakás">Lakás</option><option value="családi ház">Családi ház</option><option value="ikerház">Ikerház</option><option value="sorház">Sorház</option><option value="telek">Telek</option><option value="egyéb">Egyéb</option>
            </select>
          </div>
          <div>
            <label className="mb-2 block text-sm text-zinc-400">Státusz</label>
            <select value={status} onChange={(e) => setStatus(e.target.value as PropertyStatus)} className={inputClass}>
              <option value="active">Aktív</option><option value="draft">Piszkozat</option><option value="sold">Eladva</option><option value="inactive">Inaktív</option>
            </select>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {field("Állapot", condition, setCondition, "Felújított")}
          {field("Emelet", floor, setFloor, "1. emelet")}
          {field("Erkély / terasz", balcony, setBalcony, "8 m² erkély")}
          {field("Parkolás / garázs", parking, setParking, "Udvari beálló")}
          {field("Fűtés", heating, setHeating, "Hőszivattyú")}
        </div>

        <div className="mb-6">
          <label className="mb-2 block text-sm text-zinc-400">Leírás</label>
          <textarea rows={8} value={description} onChange={(e) => setDescription(e.target.value)} className={inputClass} placeholder="Az ingatlan részletes bemutatása..." />
        </div>

        <div className="grid gap-4 md:grid-cols-2">{field("Telefonszám", phone, setPhone, "+36 30 123 4567")}{field("E-mail", email, setEmail, "email@gmail.com", "email")}</div>

        <div className="mb-6">
          <label className="mb-3 block text-sm text-zinc-400">Képek</label>
          <input type="file" multiple accept="image/*" onChange={handleImageUpload} className="w-full rounded-2xl border border-zinc-700 bg-zinc-900 p-4" />
          {uploading && <p className="mt-2 text-sm text-yellow-400">Képek feltöltése...</p>}
        </div>

        {images.length > 0 && <div className="mb-8 grid gap-4 sm:grid-cols-2 md:grid-cols-3">{images.map((image, index) => <div key={image} className="relative overflow-hidden rounded-2xl border border-zinc-800"><img src={image} alt={`Ingatlan kép ${index + 1}`} className="h-44 w-full object-cover" />{index === 0 && <div className="absolute left-3 top-3 rounded-full bg-yellow-500 px-3 py-1 text-xs font-bold text-black">BORÍTÓ</div>}<button type="button" onClick={() => setImages((prev) => prev.filter((_, i) => i !== index))} className="absolute bottom-3 right-3 rounded-lg bg-red-600 px-3 py-1 text-sm font-bold">Törlés</button></div>)}</div>}

        <div className="mb-8">
          <label className="mb-3 block text-sm text-zinc-400">Elhelyezkedés a térképen</label>
          <MapPicker lat={lat} lng={lng} setLat={setLat} setLng={setLng} />
        </div>

        <button type="button" onClick={handleSubmit} disabled={uploading || saving} className="w-full rounded-2xl bg-yellow-500 px-6 py-4 text-lg font-black text-black transition hover:bg-yellow-400 disabled:opacity-50">{saving ? "Mentés..." : "Ingatlan mentése"}</button>
      </div>
    </div>
  );
}
