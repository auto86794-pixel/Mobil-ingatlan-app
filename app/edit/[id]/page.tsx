"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { onAuthStateChanged, type User } from "firebase/auth";
import { doc, getDoc, serverTimestamp, updateDoc } from "firebase/firestore";
import { deleteObject, getDownloadURL, ref, uploadBytes } from "firebase/storage";

import { auth, db, storage } from "../../lib/firebase";
import { createSafeImageName, validateImageFile } from "../../lib/imageUpload";
import { propertyFromFirestore, type PropertyStatus } from "../../lib/types";

const MapPicker = dynamic(() => import("@/app/components/map/MapPicker"), { ssr: false });
const inputClass = "w-full rounded-2xl border border-[#d8d2c7] bg-[#f5f2ec] px-5 py-4 outline-none transition focus:border-[#b99445]";

export default function EditPropertyPage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  const [title, setTitle] = useState("");
  const [city, setCity] = useState("");
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
  const [images, setImages] = useState<string[]>([]);
  const [lat, setLat] = useState(47.5316);
  const [lng, setLng] = useState(21.6273);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) return router.replace("/login");
      if (!currentUser.emailVerified) return router.replace("/login?verify=1");
      setUser(currentUser);
      try {
        const docRef = doc(db, "posts", params.id as string);
        const snapshot = await getDoc(docRef);
        if (!snapshot.exists()) {
          alert("Az ingatlan nem található.");
          return router.replace("/dashboard");
        }
        const property = propertyFromFirestore(snapshot.id, snapshot.data());
        const userSnapshot = await getDoc(doc(db, "users", currentUser.uid));
        const isAdmin = userSnapshot.exists() && userSnapshot.data().role === "admin";
        if (property.userId !== currentUser.uid && !isAdmin) {
          alert("Ezt az ingatlant nem szerkesztheted.");
          return router.replace("/dashboard");
        }

        setTitle(property.title); setCity(property.city); setDistrict(property.district);
        setPrice(property.price ? String(property.price) : ""); setPropertyType(property.propertyType || "lakás");
        setArea(property.area ? String(property.area) : ""); setRooms(property.rooms ? String(property.rooms) : "");
        setCondition(property.condition); setFloor(property.floor); setBalcony(property.balcony);
        setParking(property.parking); setHeating(property.heating); setStatus(property.status);
        setDescription(property.description); setPhone(property.phone); setEmail(property.email);
        setImages(property.images); setLat(property.lat); setLng(property.lng);
      } catch (err) {
        console.error(err);
        alert("Hiba betöltés közben.");
        router.replace("/dashboard");
      } finally {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, [params.id, router]);

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
      alert("Hiba képfeltöltés közben.");
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = async (image: string) => {
    const confirmed = window.confirm("Biztosan eltávolítod ezt a képet?");
    if (!confirmed) return;

    try {
      await deleteObject(ref(storage, image));
    } catch (err) {
      // Régi képnél előfordulhat, hogy nem a jelenlegi felhasználói Storage mappában van.
      // Ilyenkor a hirdetésből akkor is eltávolítjuk, hogy ne jelenjen meg tovább.
      console.warn("A Storage fájl nem törölhető:", err);
    }

    setImages((prev) => prev.filter((item) => item !== image));
  };

  const handleSetCover = (image: string) => {
    setImages((prev) => [image, ...prev.filter((item) => item !== image)]);
  };

  const handleSave = async () => {
    if (!user) return router.replace("/login");
    if (!user.emailVerified) return router.replace("/login?verify=1");
    if (!title.trim() || !city.trim() || !price || !area || !rooms) {
      alert("A cím, város, ár, alapterület és szobaszám megadása kötelező.");
      return;
    }
    try {
      setSaving(true);
      await updateDoc(doc(db, "posts", params.id as string), {
        title: title.trim(), city: city.trim(), district: district.trim(), price: Number(price),
        propertyType, area: Number(area), rooms: Number(rooms), condition: condition.trim(),
        floor: floor.trim(), balcony: balcony.trim(), parking: parking.trim(), heating: heating.trim(),
        status, description: description.trim(), phone: phone.trim(), email: email.trim(),
        imageUrl: images[0] || "", images, lat, lng, updatedAt: serverTimestamp(),
      });
      alert("Ingatlan frissítve ✅");
      router.push("/dashboard");
    } catch (err) {
      console.error(err);
      alert("Hiba mentés közben.");
    } finally {
      setSaving(false);
    }
  };

  const field = (label: string, value: string, setter: (v: string) => void, placeholder = "", type = "text") => (
    <div className="mb-4"><label className="mb-2 block text-[#6c776f]">{label}</label><input type={type} value={value} placeholder={placeholder} onChange={(e) => setter(e.target.value)} className={inputClass} /></div>
  );

  if (loading) return <div className="flex min-h-screen items-center justify-center bg-[#f7f4ee] text-[#18201b]">Betöltés...</div>;

  return (
    <div className="flex min-h-screen justify-center bg-[#f7f4ee] p-6 text-[#18201b]">
      <div className="w-full max-w-3xl rounded-[32px] border border-[#e2ddd3] bg-white p-8 shadow-[0_24px_70px_rgba(55,47,33,.10)]">
        <div className="mb-8"><h1 className="text-4xl font-black">Ingatlan szerkesztése</h1><p className="mt-2 text-[#6c776f]">Minden ingatlanadat egy helyen.</p></div>
        {field("Ingatlan neve", title, setTitle)}
        <div className="grid gap-4 md:grid-cols-2">{field("Város", city, setCity)}{field("Városrész", district, setDistrict)}</div>
        <div className="grid gap-4 md:grid-cols-3">{field("Ár (Ft)", price, setPrice, "", "number")}{field("Alapterület (m²)", area, setArea, "", "number")}{field("Szobák száma", rooms, setRooms, "", "number")}</div>
        <div className="mb-4 grid gap-4 md:grid-cols-2">
          <div><label className="mb-2 block text-[#6c776f]">Ingatlantípus</label><select value={propertyType} onChange={(e) => setPropertyType(e.target.value)} className={inputClass}><option value="lakás">Lakás</option><option value="családi ház">Családi ház</option><option value="ikerház">Ikerház</option><option value="sorház">Sorház</option><option value="telek">Telek</option><option value="egyéb">Egyéb</option></select></div>
          <div><label className="mb-2 block text-[#6c776f]">Státusz</label><select value={status} onChange={(e) => setStatus(e.target.value as PropertyStatus)} className={inputClass}><option value="active">Aktív</option><option value="draft">Piszkozat</option><option value="sold">Eladva</option><option value="inactive">Inaktív</option></select></div>
        </div>
        <div className="grid gap-4 md:grid-cols-2">{field("Állapot", condition, setCondition)}{field("Emelet", floor, setFloor)}{field("Erkély / terasz", balcony, setBalcony)}{field("Parkolás / garázs", parking, setParking)}{field("Fűtés", heating, setHeating)}</div>
        <div className="mb-6"><label className="mb-2 block text-[#6c776f]">Leírás</label><textarea rows={7} value={description} onChange={(e) => setDescription(e.target.value)} className={inputClass} /></div>
        <div className="grid gap-4 md:grid-cols-2">{field("Telefonszám", phone, setPhone)}{field("E-mail", email, setEmail, "", "email")}</div>
        <div className="mb-6"><label className="mb-3 block text-[#6c776f]">Új képek hozzáadása</label><input type="file" multiple accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp" onChange={handleImageUpload} className="w-full rounded-2xl border border-[#d8d2c7] bg-white p-4" />{uploading && <p className="mt-2 text-sm text-[#a1813a]">Képek feltöltése...</p>}</div>
        {images.length > 0 && (
          <div className="mb-8 grid gap-4 sm:grid-cols-2 md:grid-cols-3">
            {images.map((image, index) => (
              <div key={image} className="overflow-hidden rounded-2xl border border-[#e2ddd3] bg-[#f7f4ee]">
                <div className="relative">
                  <img src={image} alt={`Ingatlan kép ${index + 1}`} className="h-44 w-full object-cover" />
                  {index === 0 && <span className="absolute left-3 top-3 rounded-full bg-[#b99445] px-3 py-1 text-xs font-bold text-[#172019]">BORÍTÓ</span>}
                </div>
                <div className="grid grid-cols-2 gap-2 p-2">
                  <button type="button" disabled={index === 0} onClick={() => handleSetCover(image)} className="rounded-lg bg-[#ebe6dc] px-2 py-2 text-xs font-bold disabled:cursor-default disabled:opacity-40">Borítónak</button>
                  <button type="button" onClick={() => void handleRemoveImage(image)} className="rounded-lg bg-red-600 px-2 py-2 text-xs font-bold">Törlés</button>
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="mb-8"><label className="mb-3 block text-[#6c776f]">Elhelyezkedés a térképen</label><MapPicker lat={lat} lng={lng} setLat={setLat} setLng={setLng} /></div>
        <button type="button" onClick={handleSave} disabled={saving || uploading} className="w-full rounded-2xl bg-[#176b3a] px-6 py-4 text-lg font-black text-white transition hover:bg-[#115b30] disabled:opacity-50">{saving ? "Mentés..." : "Módosítások mentése"}</button>
      </div>
    </div>
  );
}
