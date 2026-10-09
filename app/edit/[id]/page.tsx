"use client";
import ListingQuality from "@/app/components/property/ListingQuality";
import { uploadImageBatch } from "@/app/lib/imageUploadBatch";
import { cleanPropertyPatch } from "@/app/lib/managementPolicy";
import toast from "react-hot-toast";
import { useConfirmation } from "@/app/lib/useConfirmation";

import { useEffect, useRef, useState } from "react";
import PropertyDetailSelect, { conditionOptions, floorOptions, heatingOptions, parkingOptions, cityOptions, districtOptions, balconyOptions, roomOptions, propertyTypeOptions } from "@/app/components/property/PropertyDetailSelect";
import { useParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { onAuthStateChanged, type User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";

import PropertyHistory from "@/app/components/property/PropertyHistory";
import { managementRequest } from "@/app/lib/managementClient";
import { auth, db, storage } from "../../lib/firebase";
import { createSafeImageName, validateImageFile } from "../../lib/imageUpload";
import {
  propertyFromFirestore,
  type ListingPurpose,
  type PropertyStatus,
} from "../../lib/types";
import { normalizeHungarianPhone } from "../../lib/format";

const MapPicker = dynamic(() => import("@/app/components/map/MapPicker"), {
  ssr: false,
});
const inputClass =
  "w-full rounded-2xl border border-[#d8d2c7] bg-[#f5f2ec] px-5 py-4 outline-none transition focus:border-[#b99445]";

export default function EditPropertyPage() {
  const params = useParams();
  const { confirm: confirmAction, dialog: confirmationDialog } =
    useConfirmation();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const uploadPending = useRef(false);
  const [version, setVersion] = useState(0);
  const [isAdmin, setIsAdmin] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  const [title, setTitle] = useState("");
  const [city, setCity] = useState("");
  const [district, setDistrict] = useState("");
  const [price, setPrice] = useState("");
  const [propertyType, setPropertyType] = useState("lakás");
  const [listingPurpose, setListingPurpose] = useState<ListingPurpose>("sale");
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
          toast.error("Az ingatlan nem található.");
          return router.replace("/dashboard");
        }
        const property = propertyFromFirestore(snapshot.id, snapshot.data());
        const userSnapshot = await getDoc(doc(db, "users", currentUser.uid));
        const isAdmin =
          userSnapshot.exists() && userSnapshot.data().role === "admin";
        setIsAdmin(isAdmin);
        if (property.userId !== currentUser.uid && !isAdmin) {
          toast.error("Ezt az ingatlant nem szerkesztheted.");
          return router.replace("/dashboard");
        }

        setVersion(property.version || 0);
        if (property.status === "archived") {
          toast.error("Előbb állítsd vissza a hirdetést az archívumból.");
          return router.replace(isAdmin ? "/admin" : "/dashboard");
        }
        setTitle(property.title);
        setCity(property.city);
        setDistrict(property.district);
        setPrice(property.price ? String(property.price) : "");
        setPropertyType(property.propertyType || "lakás");
        setListingPurpose(property.listingPurpose);
        setArea(property.area ? String(property.area) : "");
        setRooms(property.rooms ? String(property.rooms) : "");
        setCondition(property.condition);
        setFloor(property.floor);
        setBalcony(property.balcony);
        setParking(property.parking);
        setHeating(property.heating);
        setStatus(property.status);
        setDescription(property.description);
        setPhone(property.phone);
        setEmail(property.email);
        setImages(property.images);
        setLat(property.lat);
        setLng(property.lng);
      } catch (err) {
        console.error(err);
        toast.error("Hiba betöltés közben.");
        router.replace("/dashboard");
      } finally {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, [params.id, router]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.currentTarget;
    const files = Array.from(input.files || []);
    if (!files.length || !user || uploadPending.current || saving) return;
    uploadPending.current = true;
    setUploading(true);
    try {
      const errors = await uploadImageBatch(files, images.length, validateImageFile, async file => {
        const imageRef = ref(storage, `properties/${user.uid}/${createSafeImageName(file)}`);
        await uploadBytes(imageRef, file, { contentType: file.type });
        return getDownloadURL(imageRef);
      }, url => setImages(prev => [...prev, url]));
      if (errors.length) toast.error(errors.join("\n"));
    } finally {
      input.value = "";
      uploadPending.current = false;
      setUploading(false);
    }
  };
  const handleRemoveImage = async (image: string) => {
    const confirmed = await confirmAction("Biztosan eltávolítod ezt a képet?");
    if (!confirmed) return;

    // A fájl megmarad az előzmények visszaállításához.
    setImages((prev) => prev.filter((item) => item !== image));
  };

  const handleSetCover = (image: string) => {
    setImages((prev) => [image, ...prev.filter((item) => item !== image)]);
  };

  const handleSave = async () => {
    if (uploadPending.current || saving) return;
    if (!user) return router.replace("/login");
    if (!user.emailVerified) return router.replace("/login?verify=1");
    if (!title.trim() || !city.trim() || !price || !area || !rooms) {
      toast.error(
        "A cím, város, ár, alapterület és szobaszám megadása kötelező.",
      );
      return;
    }
    if (
      ![Number(price), Number(area), Number(rooms)].every(
        (value) => Number.isFinite(value) && value > 0,
      )
    ) {
      toast.error("Az ár, alapterület és szobaszám pozitív szám legyen.");
      return;
    }
    if (phone.trim() && !normalizeHungarianPhone(phone)) {
      toast.error("Érvénytelen magyar telefonszám. Példa: +36 30 555 1234");
      return;
    }
    try {
      cleanPropertyPatch({title, city, price:Number(price), area:Number(area), rooms:Number(rooms), listingPurpose, images, lat, lng});
      setSaving(true);
      await managementRequest(
        `/api/posts/${params.id}`,
        {
          action: "update",
          expectedVersion: version,
          patch: {
            title: title.trim(),
            city: city.trim(),
            district: district.trim(),
            price: Number(price),
            propertyType,
            listingPurpose,
            area: Number(area),
            rooms: Number(rooms),
            condition: condition.trim(),
            floor: floor.trim(),
            balcony: balcony.trim(),
            parking: parking.trim(),
            heating: heating.trim(),
            status,
            description: description.trim(),
            phone: normalizeHungarianPhone(phone) || "",
            email: email.trim(),
            imageUrl: images[0] || "",
            images,
            lat,
            lng,
          },
        },
        "PATCH",
      );
      toast.success("Ingatlan frissítve.");
      router.push(isAdmin ? "/admin" : "/dashboard");
      router.refresh();
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Hiba mentés közben.");
    } finally {
      setSaving(false);
    }
  };

  const field = (
    label: string,
    value: string,
    setter: (v: string) => void,
    placeholder = "",
    type = "text",
  ) => (
    <div className="mb-4">
      <label htmlFor={label} className="mb-2 block text-[#6c776f]">{label}</label>
      <input
        id={label}
        type={type}
        inputMode={type === "number" ? "decimal" : type === "email" ? "email" : label === "Telefonszám" ? "tel" : undefined}
        value={value}
        placeholder={placeholder}
        onChange={(e) => setter(e.target.value)}
        className={inputClass}
      />
    </div>
  );

  if (loading)
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f7f4ee] text-[#18201b]">
        Betöltés...
      </div>
    );

  return (
    <div className="flex min-h-screen justify-center bg-[#f7f4ee] p-3 sm:p-6 text-[#18201b]">
      {confirmationDialog}
      <div className="w-full max-w-3xl rounded-[32px] border border-[#e2ddd3] bg-white p-4 sm:p-8 shadow-[0_24px_70px_rgba(55,47,33,.10)]">
        <div className="mb-8">
          <h1 className="text-2xl sm:text-4xl font-black">Ingatlan szerkesztése</h1>
          <p className="mt-2 text-[#6c776f]">Minden ingatlanadat egy helyen.</p>
        </div>
        <PropertyHistory
          id={params.id as string}
          version={version}
          isAdmin={isAdmin}
        />
        {field("Ingatlan neve", title, setTitle)}
        <div className="grid gap-4 md:grid-cols-2">
          <PropertyDetailSelect label="Város" value={city} onChange={setCity} options={cityOptions} />
          <PropertyDetailSelect label="Városrész" value={district} onChange={setDistrict} options={districtOptions} />
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {field("Ár (Ft)", price, setPrice, "", "number")}
          {field("Alapterület (m²)", area, setArea, "", "number")}
          <PropertyDetailSelect label="Szobák száma" value={rooms} onChange={setRooms} options={roomOptions} inputType="number" />
        </div>
        <div className="mb-4 grid gap-4 md:grid-cols-3">
          <div>
            <label className="mb-2 block text-[#6c776f]">Hirdetés típusa</label>
            <select
              value={listingPurpose}
              onChange={(e) =>
                setListingPurpose(e.target.value as ListingPurpose)
              }
              className={inputClass}
            >
              <option value="sale">Eladó</option>
              <option value="rent">Kiadó</option>
            </select>
          </div>
          <PropertyDetailSelect label="Ingatlantípus" value={propertyType} onChange={setPropertyType} options={propertyTypeOptions} />
          <div>
            <label className="mb-2 block text-[#6c776f]">Státusz</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as PropertyStatus)}
              className={inputClass}
            >
              <option value="active">Aktív</option>
              <option value="draft">Piszkozat</option>
              <option value="sold">Eladva</option>
              <option value="inactive">Inaktív</option>
            </select>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <PropertyDetailSelect label="Állapot" value={condition} onChange={setCondition} options={conditionOptions} />
          <PropertyDetailSelect label="Emelet" value={floor} onChange={setFloor} options={floorOptions} />
          <PropertyDetailSelect label="Erkély / terasz" value={balcony} onChange={setBalcony} options={balconyOptions} />
          <PropertyDetailSelect label="Parkolás / garázs" value={parking} onChange={setParking} options={parkingOptions} />
          <PropertyDetailSelect label="Fűtés" value={heating} onChange={setHeating} options={heatingOptions} />
        </div>
        <div className="mb-6">
          <label className="mb-2 block text-[#6c776f]">Leírás</label>
          <textarea
            rows={7}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className={inputClass}
          />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {field("Telefonszám", phone, setPhone)}
          {field("E-mail", email, setEmail, "", "email")}
        </div>
        <div className="mb-6">
          <label className="mb-3 block text-[#6c776f]">
            Új képek hozzáadása
          </label>
          <input
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
            disabled={uploading || saving}
            onChange={handleImageUpload}
            className="w-full rounded-2xl border border-[#d8d2c7] bg-white p-4"
          />
          {uploading && (
            <p className="mt-2 text-sm text-[#a1813a]">Képek feltöltése...</p>
          )}
        </div>
        {images.length > 0 && (
          <div className="mb-8 grid gap-4 sm:grid-cols-2 md:grid-cols-3">
            {images.map((image, index) => (
              <div
                key={image}
                className="overflow-hidden rounded-2xl border border-[#e2ddd3] bg-[#f7f4ee]"
              >
                <div className="relative">
                  <img
                    src={image}
                    alt={`Ingatlan kép ${index + 1}`}
                    className="h-44 w-full object-cover"
                  />
                  {index === 0 && (
                    <span className="absolute left-3 top-3 rounded-full bg-[#b99445] px-3 py-1 text-xs font-bold text-[#172019]">
                      BORÍTÓ
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2 p-2">
                  <button
                    type="button"
                    disabled={index === 0}
                    onClick={() => handleSetCover(image)}
                    className="rounded-lg bg-[#ebe6dc] px-2 py-2 text-xs font-bold disabled:cursor-default disabled:opacity-40"
                  >
                    Borítónak
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleRemoveImage(image)}
                    className="rounded-lg bg-red-600 px-2 py-2 text-xs font-bold"
                  >
                    Törlés
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="mb-8">
          <label className="mb-3 block text-[#6c776f]">
            Elhelyezkedés a térképen
          </label>
          <MapPicker lat={lat} lng={lng} setLat={setLat} setLng={setLng} />
        </div>
        <ListingQuality property={{title,city,district,propertyType,price:Number(price),area:Number(area),rooms:Number(rooms),images,description,condition,heating,phone,email}} />
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || uploading}
          className="w-full rounded-2xl bg-[#008000] px-6 py-4 text-lg font-black text-white transition hover:bg-[#006b00] disabled:opacity-50"
        >
          {saving ? "Mentés..." : "Módosítások mentése"}
        </button>
      </div>
    </div>
  );
}
