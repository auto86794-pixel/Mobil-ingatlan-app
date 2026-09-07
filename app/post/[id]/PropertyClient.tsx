"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, query, where } from "firebase/firestore";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Bell, CheckCircle2, Heart, MessageCircle, Phone, Share2 } from "lucide-react";

import { auth, db } from "@/app/lib/firebase";
import { propertyFromFirestore, type PropertyWithId } from "@/app/lib/types";
import { formatPrice } from "@/app/lib/format";
import ContactModal from "@/app/components/ContactModal";

const PropertyMap = dynamic(() => import("@/app/components/map/PropertyMap"), { ssr: false });

const statusLabel: Record<string, string> = {
  active: "Aktív",
  draft: "Piszkozat",
  sold: "Eladva",
  inactive: "Inaktív",
};

export default function PropertyClient() {
  const params = useParams();
  const router = useRouter();
  const [property, setProperty] = useState<PropertyWithId | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const swipeHandledRef = useRef(false);
  const [loading, setLoading] = useState(false);
  const [similarProperties, setSimilarProperties] = useState<PropertyWithId[]>([]);
  const [shareNotice, setShareNotice] = useState("");
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [contactMode, setContactMode] = useState<"inquiry" | "alert">("inquiry");
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [favoriteNotice, setFavoriteNotice] = useState("");
  const [detailFormStatus, setDetailFormStatus] = useState<"idle" | "success" | "error">("idle");
  const [detailFormMessage, setDetailFormMessage] = useState("");

  useEffect(() => {
    const fetchProperty = async () => {
      if (!params?.id) return;
      try {
        const docSnap = await getDoc(doc(db, "posts", params.id as string));
        if (!docSnap.exists()) return;
        const data = propertyFromFirestore(docSnap.id, docSnap.data());
        setProperty(data);
        setSelectedImageIndex(0);

        const allSnapshot = await getDocs(collection(db, "posts"));
        const rankedCandidates = allSnapshot.docs
          .map((item) => propertyFromFirestore(item.id, item.data() as Record<string, unknown>))
          .filter((item) => item.id !== data.id && item.status === "active" && Boolean(item.imageUrl))
          .map((item) => {
            const sameCity = Boolean(item.city && data.city && item.city === data.city);
            const sameDistrict = Boolean(item.district && data.district && item.district === data.district);
            const sameType = Boolean(item.propertyType && data.propertyType && item.propertyType === data.propertyType);
            const priceDifference = data.price > 0 ? Math.abs(item.price - data.price) / data.price : 1;
            const areaDifference = data.area > 0 ? Math.abs(item.area - data.area) / data.area : 1;

            const score =
              (sameDistrict ? 7 : 0) +
              (sameCity ? 4 : 0) +
              (sameType ? 5 : 0) +
              (priceDifference <= 0.15 ? 4 : priceDifference <= 0.3 ? 2 : 0) +
              (areaDifference <= 0.2 ? 3 : areaDifference <= 0.35 ? 1 : 0);

            return { item, score, priceDifference };
          })
          .sort((a, b) => b.score - a.score || a.priceDifference - b.priceDifference);

        const strongMatches = rankedCandidates.filter(({ score }) => score >= 5);
        const candidates = (strongMatches.length >= 3 ? strongMatches : rankedCandidates)
          .slice(0, 3)
          .map(({ item }) => item);

        setSimilarProperties(candidates);
      } catch (error) {
        console.error(error);
      }
    };
    fetchProperty();
  }, [params]);

  useEffect(() => {
    if (!property?.id) return;

    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      if (!currentUser) {
        setIsFavorite(false);
        return;
      }

      try {
        const snapshot = await getDocs(
          query(
            collection(db, "favorites"),
            where("userId", "==", currentUser.uid),
            where("postId", "==", property.id)
          )
        );
        setIsFavorite(!snapshot.empty);
      } catch (error) {
        console.error("Kedvenc állapot betöltési hiba:", error);
      }
    });

    return unsubscribe;
  }, [property?.id]);

  const galleryImages = useMemo(() => {
    if (!property) return [];
    return Array.from(
      new Set([property.imageUrl, ...(property.images || [])].filter(Boolean))
    );
  }, [property]);

  const showPreviousImage = () => {
    if (galleryImages.length < 2) return;
    setSelectedImageIndex((current) =>
      current === 0 ? galleryImages.length - 1 : current - 1
    );
  };

  const showNextImage = () => {
    if (galleryImages.length < 2) return;
    setSelectedImageIndex((current) =>
      current === galleryImages.length - 1 ? 0 : current + 1
    );
  };

  const handleTouchStart = (clientX: number) => {
    setTouchStartX(clientX);
    swipeHandledRef.current = false;
  };

  const handleTouchEnd = (clientX: number) => {
    if (touchStartX === null) return;

    const distance = clientX - touchStartX;
    setTouchStartX(null);

    if (Math.abs(distance) < 45) return;

    swipeHandledRef.current = true;
    if (distance > 0) showPreviousImage();
    else showNextImage();
  };

  const handleShare = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: property?.title || "DebrecenHomes ingatlan", url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setShareNotice("Link kimásolva");
      window.setTimeout(() => setShareNotice(""), 1800);
    } catch (error) {
      if ((error as DOMException)?.name !== "AbortError") console.error("Megosztási hiba:", error);
    }
  };

  const handleFavorite = async () => {
    if (!property || favoriteLoading) return;

    if (!auth.currentUser) {
      setFavoriteNotice("A kedvencek mentéséhez jelentkezz be.");
      window.setTimeout(() => setFavoriteNotice(""), 2200);
      return;
    }

    setFavoriteLoading(true);
    try {
      const favoritesRef = collection(db, "favorites");
      const snapshot = await getDocs(
        query(
          favoritesRef,
          where("userId", "==", auth.currentUser.uid),
          where("postId", "==", property.id)
        )
      );

      if (!snapshot.empty) {
        await Promise.all(snapshot.docs.map((item) => deleteDoc(doc(db, "favorites", item.id))));
        setIsFavorite(false);
        setFavoriteNotice("Eltávolítva a kedvencekből.");
      } else {
        await addDoc(favoritesRef, { userId: auth.currentUser.uid, postId: property.id });
        setIsFavorite(true);
        setFavoriteNotice("Elmentve a kedvencek közé.");
      }
    } catch (error) {
      console.error("Kedvenc módosítási hiba:", error);
      setFavoriteNotice("A mentés most nem sikerült.");
    } finally {
      setFavoriteLoading(false);
      window.setTimeout(() => setFavoriteNotice(""), 2200);
    }
  };

  const handleMainImageClick = () => {
    if (swipeHandledRef.current) {
      swipeHandledRef.current = false;
      return;
    }
    setGalleryOpen(true);
  };

  useEffect(() => {
    if (!galleryOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setGalleryOpen(false);
      if (event.key === "ArrowLeft") showPreviousImage();
      if (event.key === "ArrowRight") showNextImage();
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [galleryOpen, galleryImages.length]);

  if (!property) {
    return <div className="flex min-h-screen items-center justify-center bg-[#f7f4ee] text-2xl text-[#18201b]">Betöltés...</div>;
  }

  const selectedImage = galleryImages[selectedImageIndex] || "";

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
    <div className="min-h-screen bg-[#f7f4ee] px-4 pb-48 pt-4 text-[#18201b] md:p-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-3 flex items-center justify-between gap-3 sm:mb-5">
          <button type="button" onClick={() => router.push("/properties#results")} className="inline-flex items-center gap-2 rounded-full border border-[#ddd7cb] bg-white px-4 py-2.5 text-sm font-bold text-[#344139] shadow-sm hover:border-[#b9d1c0]">
            <ArrowLeft size={17} /> Vissza a találatokhoz
          </button>
          <div className="flex items-center gap-2">
            <button type="button" onClick={handleFavorite} disabled={favoriteLoading} className={`inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-bold shadow-sm transition disabled:opacity-60 ${isFavorite ? "border-rose-200 bg-rose-50 text-rose-600" : "border-[#ddd7cb] bg-white text-[#176b3a] hover:border-[#b9d1c0]"}`}>
              <Heart size={17} fill={isFavorite ? "currentColor" : "none"} /> <span className="hidden sm:inline">{isFavorite ? "Mentve" : "Mentés"}</span>
            </button>
            <button type="button" onClick={handleShare} className="inline-flex items-center gap-2 rounded-full border border-[#ddd7cb] bg-white px-4 py-2.5 text-sm font-bold text-[#176b3a] shadow-sm hover:border-[#b9d1c0]">
              <Share2 size={17} /> <span className="hidden sm:inline">Megosztás</span>
            </button>
          </div>
        </div>
        {selectedImage ? (
          <div className="relative overflow-hidden rounded-3xl border border-[#e2ddd3] bg-white">
            <button
              type="button"
              onClick={handleMainImageClick}
              onTouchStart={(event) => handleTouchStart(event.touches[0].clientX)}
              onTouchEnd={(event) => handleTouchEnd(event.changedTouches[0].clientX)}
              className="block w-full touch-pan-y cursor-zoom-in"
              aria-label="Galéria megnyitása"
            >
              <img
                src={selectedImage}
                alt={`${property.title} ${selectedImageIndex + 1}. kép`}
                className="h-[300px] w-full object-cover transition-all duration-300 sm:h-[500px]" decoding="async" fetchPriority="high"
              />
            </button>

            {galleryImages.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={showPreviousImage}
                  className="absolute left-3 top-1/2 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-2xl shadow-lg transition hover:bg-white sm:flex"
                  aria-label="Előző kép"
                >
                  ‹
                </button>
                <button
                  type="button"
                  onClick={showNextImage}
                  className="absolute right-3 top-1/2 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-2xl shadow-lg transition hover:bg-white sm:flex"
                  aria-label="Következő kép"
                >
                  ›
                </button>
              </>
            )}

            <div className="absolute bottom-3 right-3 rounded-full bg-black/65 px-3 py-1.5 text-sm font-bold text-white backdrop-blur-sm">
              {selectedImageIndex + 1} / {galleryImages.length}
            </div>

            <button
              type="button"
              onClick={() => setGalleryOpen(true)}
              className="absolute bottom-3 left-3 rounded-full bg-white/90 px-3 py-1.5 text-sm font-bold text-[#18201b] shadow-sm backdrop-blur-sm"
            >
              Összes kép
            </button>
          </div>
        ) : (
          <div className="flex h-[360px] items-center justify-center rounded-3xl border border-[#e2ddd3] bg-white text-[#879087]">Nincs feltöltött kép</div>
        )}

        {galleryImages.length > 1 && (
          <div className="-mx-2 mt-4 flex gap-2 overflow-x-auto px-2 pb-2 sm:mx-0 sm:grid sm:grid-cols-4 sm:gap-3 sm:overflow-visible sm:px-0 md:grid-cols-5">
            {galleryImages.map((image, index) => (
              <button
                key={`${image}-${index}`}
                type="button"
                onClick={() => setSelectedImageIndex(index)}
                className={`relative h-20 w-28 shrink-0 overflow-hidden rounded-xl border-2 transition sm:h-24 sm:w-auto ${
                  selectedImageIndex === index
                    ? "border-[#176b3a]"
                    : "border-transparent opacity-80 hover:opacity-100"
                }`}
                aria-label={`${index + 1}. kép kiválasztása`}
              >
                <img
                  src={image}
                  alt={`${property.title} ${index + 1}. bélyegkép`}
                  className="h-full w-full object-cover" loading="lazy" decoding="async"
                />
              </button>
            ))}
          </div>
        )}

        <div className="mt-5 sm:mt-10">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {property.featured && <span className="rounded-full bg-[#ead8a5] px-3 py-1 text-xs font-bold text-[#172019]">⭐ KIEMELT</span>}
            <span className="rounded-full border border-[#d8d2c7] bg-white px-3 py-1 text-xs text-[#4d5a51]">{statusLabel[property.status] || property.status}</span>
          </div>
          <h1 className="mt-3 text-[28px] font-black leading-[1.08] tracking-tight sm:mt-4 sm:text-5xl">{property.title}</h1>
          <p className="mt-2 text-base text-[#6c776f] sm:mt-3 sm:text-xl">📍 {property.city}{property.district ? `, ${property.district}` : ""}</p>
          <p className="mt-3 text-[30px] font-black tracking-tight text-[#176b3a] sm:mt-6 sm:text-4xl">{formatPrice(property.price)}</p>

          {(property.phone || property.email) && (
            <div className="mt-5 hidden items-center justify-between gap-4 rounded-3xl border border-[#d9e7dc] bg-[#f2f7f3] p-5 md:flex">
              <div>
                <p className="text-sm font-black text-[#18201b]">Érdekel ez az ingatlan?</p>
                <p className="mt-1 text-sm text-[#667168]">Kérdezz róla közvetlenül, vagy küldj érdeklődést pár másodperc alatt.</p>
              </div>
              <div className="flex shrink-0 gap-2">
                {property.phone ? (
                  <a href={`tel:${property.phone}`} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-[#b9d1c0] bg-white px-5 text-sm font-black text-[#176b3a] transition hover:border-[#8fbc9d]">
                    <Phone size={18} /> Hívás
                  </a>
                ) : null}
                {property.email ? (
                  <button type="button" onClick={() => document.getElementById("contact-form")?.scrollIntoView({ behavior: "smooth", block: "start" })} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#176b3a] px-5 text-sm font-black text-white transition hover:bg-[#115b30]">
                    <MessageCircle size={18} /> Érdeklődöm
                  </button>
                ) : null}
              </div>
            </div>
          )}

          <div className="mt-4 grid grid-cols-2 gap-2 sm:hidden">
            {property.area ? <div className="rounded-xl border border-[#ddd7cb] bg-white px-3 py-2.5 text-sm font-bold">📐 {property.area} m²</div> : null}
            {property.rooms ? <div className="rounded-xl border border-[#ddd7cb] bg-white px-3 py-2.5 text-sm font-bold">🛏️ {property.rooms} szoba</div> : null}
            {property.propertyType ? <div className="rounded-xl border border-[#ddd7cb] bg-white px-3 py-2.5 text-sm font-bold">🏠 {property.propertyType}</div> : null}
          </div>

          {details.length > 0 && <div className="mt-6 grid grid-cols-2 gap-2 sm:mt-8 sm:gap-4 lg:grid-cols-3">{details.map(([label, value]) => <div key={label} className="rounded-2xl border border-[#e2ddd3] bg-white p-4 sm:p-5"><div className="text-xs text-[#879087] sm:text-sm">{label}</div><div className="mt-1 text-sm font-bold text-[#18201b] sm:text-base">{value}</div></div>)}</div>}

          <div className="mt-6 rounded-3xl border border-[#e2ddd3] bg-white p-5 sm:mt-8 sm:p-8">
            <h2 className="mb-4 text-2xl font-bold">Leírás</h2>
            <p className="whitespace-pre-line leading-8 text-[#4d5a51]">{property.description || "Nincs megadott leírás."}</p>
          </div>

          <div className="mt-8 flex flex-col gap-6">
            {property.email && <div id="contact-form" className="w-full max-w-2xl scroll-mt-24 rounded-3xl border border-[#e2ddd3] bg-white p-5 shadow-sm sm:p-8">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#a1813a]">Gyors érdeklődés</p>
              <h2 className="mt-1 text-3xl font-black">Kapcsolatfelvétel</h2>
              <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-[#667168]">
                <span className="inline-flex items-center gap-1.5"><CheckCircle2 size={16} className="text-[#176b3a]" /> Rövid űrlap</span>
                <span className="inline-flex items-center gap-1.5"><CheckCircle2 size={16} className="text-[#176b3a]" /> Az ingatlan adatai automatikusan mennek</span>
              </div>
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
                      phone: formData.get("phone"),
                      email: formData.get("email"),
                      message: formData.get("message"),
                      propertyEmail: property.email,
                      propertyTitle: property.title,
                      propertyId: property.id,
                      propertyUrl: `${window.location.origin}/post/${property.id}`,
                      website: formData.get("website"),
                    }),
                  });
                  const data = await response.json();
                  if (!response.ok) throw new Error(data.error || "Hiba történt az üzenet küldésekor.");
                  (e.target as HTMLFormElement).reset();
                  setDetailFormStatus("success");
                  setDetailFormMessage("Köszönjük az érdeklődést! Megkaptuk az üzeneted, hamarosan felvesszük veled a kapcsolatot.");
                } catch (error) {
                  console.error(error);
                  setDetailFormStatus("error");
                  setDetailFormMessage(error instanceof Error ? error.message : "Hiba történt az üzenet küldésekor.");
                } finally {
                  setLoading(false);
                }
              }} className="flex flex-col gap-4">
                <div className="absolute left-[-9999px] h-px w-px overflow-hidden" aria-hidden="true"><label htmlFor="detail-website">Weboldal</label><input id="detail-website" type="text" name="website" tabIndex={-1} autoComplete="off" /></div>
                <div className="rounded-2xl bg-[#f2f7f3] px-4 py-3 text-sm text-[#4d5a51]"><span className="font-bold text-[#176b3a]">Érdeklődés erről:</span> {property.title}</div>
                <input type="text" name="name" placeholder="Név" autoComplete="name" required className="min-h-12 rounded-2xl border border-[#d8d2c7] bg-[#f7f4ee] p-4 text-[#18201b] outline-none focus:border-[#8fbc9d] focus:ring-2 focus:ring-[#d9eadf]" />
                <input type="tel" name="phone" placeholder="Telefonszám (ajánlott)" autoComplete="tel" inputMode="tel" className="min-h-12 rounded-2xl border border-[#d8d2c7] bg-[#f7f4ee] p-4 text-[#18201b] outline-none focus:border-[#8fbc9d] focus:ring-2 focus:ring-[#d9eadf]" />
                <input type="email" name="email" placeholder="E-mail" autoComplete="email" required className="min-h-12 rounded-2xl border border-[#d8d2c7] bg-[#f7f4ee] p-4 text-[#18201b] outline-none focus:border-[#8fbc9d] focus:ring-2 focus:ring-[#d9eadf]" />
                <textarea name="message" defaultValue={`Érdeklődöm a(z) „${property.title}” ingatlan iránt.`} required className="min-h-[150px] rounded-2xl border border-[#d8d2c7] bg-[#f7f4ee] p-4 text-[#18201b] outline-none focus:border-[#8fbc9d] focus:ring-2 focus:ring-[#d9eadf]" aria-label="Üzenet" />
                {detailFormStatus !== "idle" ? (
                  <div className={`rounded-2xl px-4 py-3 text-sm font-semibold ${detailFormStatus === "success" ? "bg-[#eef7f0] text-[#176b3a]" : "bg-red-50 text-red-700"}`} role={detailFormStatus === "error" ? "alert" : "status"} aria-live="polite">
                    {detailFormMessage}
                  </div>
                ) : null}
                <button type="submit" disabled={loading} onClick={() => { setDetailFormStatus("idle"); setDetailFormMessage(""); }} className="min-h-12 rounded-2xl bg-[#176b3a] px-6 py-4 font-bold text-white transition hover:bg-[#115b30] disabled:opacity-50">{loading ? "Küldés..." : "✉️ Érdeklődés elküldése"}</button>
              </form>
            </div>}
          </div>

          {similarProperties.length > 0 && (
            <section className="mt-10">
              <div className="mb-4 flex items-end justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#a1813a]">Még érdemes megnézni</p>
                  <h2 className="mt-1 text-2xl font-black text-[#18201b] sm:text-3xl">Hasonló ingatlanok</h2>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {similarProperties.map((item) => (
                  <a key={item.id} href={`/post/${item.id}`} className="group overflow-hidden rounded-3xl border border-[#e2ddd3] bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                    <div className="h-44 overflow-hidden bg-[#ece7de]">
                      <img src={item.imageUrl} alt={item.title} loading="lazy" decoding="async" className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]" />
                    </div>
                    <div className="p-4">
                      <p className="line-clamp-2 font-black leading-snug text-[#172019]">{item.title}</p>
                      <p className="mt-1 text-sm text-[#6c776f]">{item.city}{item.district ? `, ${item.district}` : ""}</p>
                      <div className="mt-3 flex flex-wrap gap-1.5 text-xs font-bold text-[#59645c]">
                        {item.area ? <span className="rounded-full bg-[#f3f0ea] px-2.5 py-1">{item.area} m²</span> : null}
                        {item.rooms ? <span className="rounded-full bg-[#f3f0ea] px-2.5 py-1">{item.rooms} szoba</span> : null}
                        {item.propertyType ? <span className="rounded-full bg-[#f3f0ea] px-2.5 py-1">{item.propertyType}</span> : null}
                      </div>
                      <div className="mt-3 flex items-center justify-between gap-3">
                        <p className="text-lg font-black text-[#176b3a]">{formatPrice(item.price)}</p>
                        <span className="text-sm font-black text-[#176b3a] transition group-hover:translate-x-0.5">Megnézem →</span>
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            </section>
          )}

          <section className="mt-8 rounded-[28px] border border-[#d9e7dc] bg-[#f2f7f3] p-5 sm:p-7">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#a1813a]">Ne maradj le</p>
                <h2 className="mt-1 text-2xl font-black text-[#172019]">Kérsz értesítést hasonló ingatlanokról?</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-[#667168]">Írd meg az elérhetőséged, és jelezheted, hogy ehhez hasonló debreceni ingatlanokat keresel.</p>
              </div>
              <button type="button" onClick={() => { setContactMode("alert"); setContactModalOpen(true); }} className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-2xl bg-[#176b3a] px-5 text-sm font-black text-white transition hover:bg-[#115b30]">
                <Bell size={18} /> Értesítést kérek
              </button>
            </div>
          </section>

          {property.lat && property.lng ? <div className="mt-10"><h2 className="mb-4 text-3xl font-black text-[#18201b]">📍 Elhelyezkedés</h2><PropertyMap lat={property.lat} lng={property.lng} title={property.title} /></div> : null}
        </div>
      </div>

      {(shareNotice || favoriteNotice) && <div className="fixed right-4 top-20 z-[90] rounded-full bg-[#172019] px-4 py-2.5 text-sm font-bold text-white shadow-xl">{shareNotice || favoriteNotice}</div>}

      {!galleryOpen && (property.phone || property.email) && (
        <div className="fixed inset-x-0 bottom-[76px] z-40 border-t border-[#ddd7cb] bg-white/95 px-3 pb-3 pt-3 shadow-[0_-8px_28px_rgba(24,32,27,0.10)] backdrop-blur-md md:hidden">
          <div className="mx-auto flex max-w-md gap-2.5">
            {property.phone ? (
              <a
                href={`tel:${property.phone}`}
                className="flex min-h-14 flex-1 items-center justify-center gap-2 rounded-2xl border border-[#b9d1c0] bg-[#f3f8f4] px-4 text-sm font-black text-[#176b3a] active:scale-[0.99]"
              >
                <Phone size={18} /> Hívás
              </a>
            ) : null}
            {property.email ? (
              <button
                type="button"
                onClick={() => { setContactMode("inquiry"); setContactModalOpen(true); }}
                className="flex min-h-14 flex-[1.35] items-center justify-center gap-2 rounded-2xl bg-[#176b3a] px-4 text-sm font-black text-white shadow-[0_8px_22px_rgba(23,107,58,.18)] active:scale-[0.99]"
              >
                <MessageCircle size={18} /> Érdeklődöm
              </button>
            ) : null}
          </div>
        </div>
      )}

      <ContactModal
        open={contactModalOpen}
        setOpen={setContactModalOpen}
        propertyTitle={property.title}
        propertyId={property.id}
        modalTitle={contactMode === "alert" ? "Hasonló ingatlan értesítő" : "Érdeklődöm"}
        initialMessage={contactMode === "alert" ? `Kérek értesítést a(z) „${property.title}” ingatlanhoz hasonló debreceni ingatlanokról.` : undefined}
        submitLabel={contactMode === "alert" ? "Értesítést kérek" : "Érdeklődés elküldése"}
        successMessage={contactMode === "alert" ? "Megkaptuk a kérésed. Ha hasonló ingatlan érkezik, az érdeklődésed alapján fel tudjuk venni veled a kapcsolatot." : undefined}
      />

      {galleryOpen && selectedImage && (
        <div
          className="fixed inset-0 z-[100] flex flex-col bg-black"
          role="dialog"
          aria-modal="true"
          aria-label="Ingatlan galéria"
          onTouchStart={(event) => handleTouchStart(event.touches[0].clientX)}
          onTouchEnd={(event) => handleTouchEnd(event.changedTouches[0].clientX)}
        >
          <div className="flex h-16 shrink-0 items-center justify-between px-4 text-white sm:px-6">
            <div className="text-sm font-bold sm:text-base">{selectedImageIndex + 1} / {galleryImages.length}</div>
            <button
              type="button"
              onClick={() => setGalleryOpen(false)}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-white/15 text-3xl leading-none transition hover:bg-white/25"
              aria-label="Galéria bezárása"
            >
              ×
            </button>
          </div>

          <div className="relative flex min-h-0 flex-1 items-center justify-center sm:px-16">
            <img
              src={selectedImage}
              alt={`${property.title} ${selectedImageIndex + 1}. kép`}
              className="max-h-full max-w-full select-none object-contain"
              draggable={false}
            />

            {galleryImages.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={showPreviousImage}
                  className="absolute left-4 top-1/2 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-4xl text-white transition hover:bg-white/25 sm:flex"
                  aria-label="Előző kép"
                >
                  ‹
                </button>
                <button
                  type="button"
                  onClick={showNextImage}
                  className="absolute right-4 top-1/2 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-4xl text-white transition hover:bg-white/25 sm:flex"
                  aria-label="Következő kép"
                >
                  ›
                </button>
              </>
            )}
          </div>

          {galleryImages.length > 1 && (
            <div className="flex shrink-0 gap-2 overflow-x-auto px-4 py-4 sm:justify-center sm:px-6">
              {galleryImages.map((image, index) => (
                <button
                  key={`fullscreen-${image}-${index}`}
                  type="button"
                  onClick={() => setSelectedImageIndex(index)}
                  className={`h-16 w-24 shrink-0 overflow-hidden rounded-lg border-2 transition sm:h-20 sm:w-28 ${
                    selectedImageIndex === index
                      ? "border-white"
                      : "border-transparent opacity-55 hover:opacity-100"
                  }`}
                  aria-label={`${index + 1}. kép megnyitása`}
                >
                  <img src={image} alt="" className="h-full w-full object-cover" loading="lazy" decoding="async" />
                </button>
              ))}
            </div>
          )}

          <div className="pb-[max(env(safe-area-inset-bottom),8px)] text-center text-xs text-white/60 sm:hidden">
            Húzd jobbra vagy balra a lapozáshoz
          </div>
        </div>
      )}
    </div>
  );
}
