"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, type User } from "firebase/auth";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";

import { auth, db, storage } from "../lib/firebase";
import { createSafeImageName, validateImageFile } from "../lib/imageUpload";
import type { ListingType, PropertyStatus } from "../lib/types";

const MapPicker = dynamic(() => import("@/app/components/map/MapPicker"), { ssr: false });

const inputClass = "w-full rounded-2xl border border-[#d8d2c7] bg-[#f5f2ec] px-5 py-4 outline-none transition focus:border-[#b99445]";

export default function Create() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [title, setTitle] = useState("");
  const [city, setCity] = useState("Debrecen");
  const [district, setDistrict] = useState("");
  const [price, setPrice] = useState("");
  const [propertyType, setPropertyType] = useState("lakás");
  const [listingType, setListingType] = useState<ListingType>("sale");
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
      if (!currentUser.emailVerified) {
        router.replace("/login?verify=1");
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
        const validationError = validateImageFile(file);
        if (validationError) {
          alert(validationError);
          return;
        }
        const safeName = createSafeImageName(file);
        const imageRef = ref(storage, `properties/${user.uid}/${safeName}`);
        await uploadBytes(imageRef, file, { contentType: file.type });
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
    if (!user.emailVerified) return router.replace("/login?verify=1");
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
        listingType,
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
    return <div className="flex min-h-screen items-center justify-center bg-[#f7f4ee] text-[#18201b]">Bejelentkezés ellenőrzése...</div>;
  }

  const field = (label: string, value: string, setter: (v: string) => void, placeholder = "", type = "text") => (
    <div className="mb-4">
      <label className="mb-2 block text-sm text-[#6c776f]">{label}</label>
      <input type={type} placeholder={placeholder} value={value} onChange={(e) => setter(e.target.value)} className={inputClass} />
    </div>
  );

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f7f4ee] p-6 text-[#18201b]">
      <div className="w-full max-w-3xl rounded-[32px] border border-[#e2ddd3] bg-white p-8 shadow-[0_24px_70px_rgba(55,47,33,.10)]">
        <div className="mb-8">
          <h1 className="text-4xl font-black tracking-tight">Új ingatlan</h1>
          <p className="mt-2 text-[#6c776f]">Egységes DebrecenHomes ingatlan-adatlap.</p>
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

        <div className="mb-4 grid gap-4 md:grid-cols-3">
          <div>
            <label className="mb-2 block text-sm text-[#6c776f]">Ingatlantípus</label>
            <select value={propertyType} onChange={(e) => setPropertyType(e.target.value)} className={inputClass}>
              <option value="lakás">Lakás</option><option value="családi ház">Családi ház</option><option value="ikerház">Ikerház</option><option value="sorház">Sorház</option><option value="telek">Telek</option><option value="egyéb">Egyéb</option>
            </select>
          </div>
          <div>
            <label className="mb-2 block text-sm text-[#6c776f]">Hirdetés típusa</label>
            <select value={listingType} onChange={(e) => setListingType(e.target.value as ListingType)} className={inputClass}>
              <option value="sale">Eladó</option><option value="rent">Kiadó</option>
            </select>
          </div>
          <div>
            <label className="mb-2 block text-sm text-[#6c776f]">Státusz</label>
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
          <label className="mb-2 block text-sm text-[#6c776f]">Leírás</label>
          <textarea rows={8} value={description} onChange={(e) => setDescription(e.target.value)} className={inputClass} placeholder="Az ingatlan részletes bemutatása..." />
        </div>

        <div className="grid gap-4 md:grid-cols-2">{field("Telefonszám", phone, setPhone, "+36 30 123 4567")}{field("E-mail", email, setEmail, "email@gmail.com", "email")}</div>

        <div className="mb-6">
          <label className="mb-3 block text-sm text-[#6c776f]">Képek</label>
          <input type="file" multiple accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp" onChange={handleImageUpload} className="w-full rounded-2xl border border-[#d8d2c7] bg-white p-4" />
          {uploading && <p className="mt-2 text-sm text-[#a1813a]">Képek feltöltése...</p>}
        </div>

        {images.length > 0 && <div className="mb-8 grid gap-4 sm:grid-cols-2 md:grid-cols-3">{images.map((image, index) => <div key={image} className="relative overflow-hidden rounded-2xl border border-[#e2ddd3]"><img src={image} alt={`Ingatlan kép ${index + 1}`} className="h-44 w-full object-cover" />{index === 0 && <div className="absolute left-3 top-3 rounded-full bg-[#b99445] px-3 py-1 text-xs font-bold text-[#172019]">BORÍTÓ</div>}<button type="button" onClick={() => setImages((prev) => prev.filter((_, i) => i !== index))} className="absolute bottom-3 right-3 rounded-lg bg-red-600 px-3 py-1 text-sm font-bold">Törlés</button></div>)}</div>}

        <div className="mb-8">
          <label className="mb-3 block text-sm text-[#6c776f]">Elhelyezkedés a térképen</label>
          <MapPicker lat={lat} lng={lng} setLat={setLat} setLng={setLng} />
        </div>

        <button type="button" onClick={handleSubmit} disabled={uploading || saving} className="w-full rounded-2xl bg-[#176b3a] px-6 py-4 text-lg font-black text-white transition hover:bg-[#115b30] disabled:opacity-50">{saving ? "Mentés..." : "Ingatlan mentése"}</button>
      </div>
    </div>
  );
}
