"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { doc, getDoc } from "firebase/firestore";
import { useParams } from "next/navigation";

import { db } from "@/app/lib/firebase";
import { propertyFromFirestore, type PropertyWithId } from "@/app/lib/types";

const PropertyMap = dynamic(() => import("@/app/components/map/PropertyMap"), { ssr: false });

const statusLabel: Record<string, string> = {
  active: "Aktív",
  draft: "Piszkozat",
  sold: "Eladva",
  inactive: "Inaktív",
};

export default function PropertyClient() {
  const params = useParams();
  const [property, setProperty] = useState<PropertyWithId | null>(null);
  const [selectedImage, setSelectedImage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchProperty = async () => {
      if (!params?.id) return;
      try {
        const docSnap = await getDoc(doc(db, "posts", params.id as string));
        if (!docSnap.exists()) return;
        const data = propertyFromFirestore(docSnap.id, docSnap.data());
        setProperty(data);
        setSelectedImage(data.imageUrl || data.images[0] || "");
      } catch (error) {
        console.error(error);
      }
    };
    fetchProperty();
  }, [params]);

  if (!property) {
    return <div className="flex min-h-screen items-center justify-center bg-black text-2xl text-white">Betöltés...</div>;
  }

  const details = [
    ["Ingatlantípus", property.propertyType],
    ["Alapterület", property.area ? `${property.area} m²` : ""],
    ["Szobák", property.rooms ? String(property.rooms) : ""],
    ["Állapot", property.condition],
    ["Emelet", property.floor],
    ["Erkély / terasz", property.balcony],
    ["Parkolás / garázs", property.parking],
    ["Fűtés", property.heating],
    ["Státusz", statusLabel[property.status] || property.status],
  ].filter(([, value]) => value);

  return (
    <div className="min-h-screen bg-black p-6 text-white">
      <div className="mx-auto max-w-6xl">
        {selectedImage ? (
          <img src={selectedImage} alt={property.title} className="h-[500px] w-full rounded-3xl border border-zinc-800 object-cover transition-all duration-300" />
        ) : (
          <div className="flex h-[360px] items-center justify-center rounded-3xl border border-zinc-800 bg-zinc-900 text-zinc-500">Nincs feltöltött kép</div>
        )}

        {property.images.length > 1 && <div className="mt-6 grid gap-4 sm:grid-cols-2 md:grid-cols-3">{property.images.map((image, index) => <img key={image} src={image} alt={`${property.title} ${index + 1}. kép`} onClick={() => setSelectedImage(image)} className={`h-48 w-full cursor-pointer rounded-2xl border object-cover transition duration-300 hover:scale-[1.02] ${selectedImage === image ? "border-yellow-500" : "border-zinc-800"}`} />)}</div>}

        <div className="mt-10">
          <div className="flex flex-wrap items-center gap-3">
            {property.featured && <span className="rounded-full bg-yellow-400 px-3 py-1 text-xs font-bold text-black">⭐ KIEMELT</span>}
            <span className="rounded-full border border-zinc-700 bg-zinc-900 px-3 py-1 text-xs text-zinc-300">{statusLabel[property.status] || property.status}</span>
          </div>
          <h1 className="mt-4 text-5xl font-black">{property.title}</h1>
          <p className="mt-3 text-xl text-zinc-400">📍 {property.city}{property.district ? `, ${property.district}` : ""}</p>
          <p className="mt-6 text-4xl font-bold text-yellow-400">{property.price.toLocaleString("hu-HU")} Ft</p>

          {details.length > 0 && <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{details.map(([label, value]) => <div key={label} className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5"><div className="text-sm text-zinc-500">{label}</div><div className="mt-1 font-bold text-white">{value}</div></div>)}</div>}

          <div className="mt-8 rounded-3xl border border-zinc-800 bg-zinc-900 p-8">
            <h2 className="mb-4 text-2xl font-bold">Leírás</h2>
            <p className="whitespace-pre-line leading-8 text-zinc-300">{property.description || "Nincs megadott leírás."}</p>
          </div>

          <div className="mt-8 flex flex-col gap-6">
            {property.phone && <a href={`tel:${property.phone}`} className="w-fit rounded-2xl bg-green-500 px-6 py-4 font-bold text-white transition hover:bg-green-400">📞 Hívás</a>}

            {property.email && <div className="w-full max-w-2xl rounded-3xl border border-zinc-800 bg-zinc-900 p-8">
              <h2 className="mb-6 text-3xl font-black">✉️ Kapcsolatfelvétel</h2>
              <form onSubmit={async (e) => {
                e.preventDefault();
                setLoading(true);
                const formData = new FormData(e.currentTarget);
                try {
                  const response = await fetch("/api/contact", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      name: formData.get("name"),
                      email: formData.get("email"),
                      message: formData.get("message"),
                      propertyEmail: property.email,
                      propertyTitle: property.title,
                    }),
                  });
                  const data = await response.json();
                  if (!response.ok) throw new Error(data.error);
                  alert("Üzenet sikeresen elküldve! 🎉");
                  (e.target as HTMLFormElement).reset();
                } catch (error) {
                  console.error(error);
                  alert("Hiba történt 😢");
                } finally {
                  setLoading(false);
                }
              }} className="flex flex-col gap-4">
                <input type="text" name="name" placeholder="Név" required className="rounded-2xl border border-zinc-700 bg-black p-4 text-white outline-none" />
                <input type="email" name="email" placeholder="Email" required className="rounded-2xl border border-zinc-700 bg-black p-4 text-white outline-none" />
                <textarea name="message" placeholder="Üzenet" required className="min-h-[160px] rounded-2xl border border-zinc-700 bg-black p-4 text-white outline-none" />
                <button type="submit" disabled={loading} className="rounded-2xl bg-blue-500 px-6 py-4 font-bold text-white transition hover:bg-blue-400 disabled:opacity-50">{loading ? "Küldés..." : "✉️ Üzenet küldése"}</button>
              </form>
            </div>}
          </div>

          {property.lat && property.lng ? <div className="mt-10"><h2 className="mb-4 text-3xl font-black text-white">📍 Elhelyezkedés</h2><PropertyMap lat={property.lat} lng={property.lng} title={property.title} /></div> : null}
        </div>
      </div>
    </div>
  );
}
