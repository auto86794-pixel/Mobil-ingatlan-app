"use client";

import Link from "next/link";
import { onAuthStateChanged } from "firebase/auth";
import { collection, getDocs, query, where } from "firebase/firestore";
import { Heart, LogIn, MapPin } from "lucide-react";
import { useEffect, useState } from "react";

import { auth, db } from "@/app/lib/firebase";
import { formatPrice } from "@/app/lib/format";
import { propertyFromFirestore, type PropertyWithId } from "@/app/lib/types";

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<PropertyWithId[]>([]);
  const [loading, setLoading] = useState(true);
  const [signedIn, setSignedIn] = useState<boolean | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setSignedIn(Boolean(currentUser));

      if (!currentUser) {
        setFavorites([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const favoritesSnapshot = await getDocs(
          query(collection(db, "favorites"), where("userId", "==", currentUser.uid))
        );
        const postIds = favoritesSnapshot.docs
          .map((item) => item.data().postId)
          .filter((value): value is string => typeof value === "string" && value.length > 0);

        if (postIds.length === 0) {
          setFavorites([]);
          return;
        }

        const postsSnapshot = await getDocs(collection(db, "posts"));
        const favoriteIdSet = new Set(postIds);
        const posts = postsSnapshot.docs
          .filter((item) => favoriteIdSet.has(item.id))
          .map((item) => propertyFromFirestore(item.id, item.data() as Record<string, unknown>))
          .filter((item) => item.status === "active" && Boolean(item.title && item.imageUrl));

        setFavorites(posts);
      } catch (error) {
        console.error("Kedvencek betöltési hiba:", error);
        setFavorites([]);
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  if (loading || signedIn === null) {
    return <div className="flex min-h-[60vh] items-center justify-center bg-[#f7f4ee] text-lg font-bold text-[#18201b]">Kedvencek betöltése...</div>;
  }

  if (!signedIn) {
    return (
      <main className="mx-auto min-h-[70vh] max-w-3xl px-4 py-12 sm:px-6">
        <div className="rounded-[32px] border border-[#e2ddd3] bg-white p-8 text-center shadow-sm sm:p-12">
          <Heart className="mx-auto h-14 w-14 text-[#176b3a]" />
          <h1 className="mt-5 text-3xl font-black text-[#172019]">A kedvencekhez jelentkezz be</h1>
          <p className="mx-auto mt-3 max-w-xl leading-7 text-[#667168]">Belépés után elmentheted az érdekes ingatlanokat, és később innen egy helyen visszanézheted őket.</p>
          <Link href="/login" className="mt-7 inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#176b3a] px-6 font-bold text-white transition hover:bg-[#115b30]"><LogIn size={18} /> Belépés</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen max-w-[1500px] px-4 py-8 sm:px-6">
      <div className="mb-8">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#a1813a]">Saját lista</p>
        <h1 className="mt-2 text-4xl font-black tracking-tight text-[#172019] sm:text-5xl">Mentett ingatlanok</h1>
        <p className="mt-3 text-[#667168]">{favorites.length} elérhető kedvenc ingatlan</p>
      </div>

      {favorites.length === 0 ? (
        <div className="rounded-[32px] border border-[#e2ddd3] bg-white p-10 text-center sm:p-16">
          <Heart className="mx-auto h-14 w-14 text-[#b7c0b9]" />
          <h2 className="mt-5 text-2xl font-black text-[#172019]">Még nincs mentett ingatlanod</h2>
          <p className="mt-3 text-[#667168]">A szív ikonra kattintva elmentheted a később megnézendő hirdetéseket.</p>
          <Link href="/properties#ingatlanok" className="mt-7 inline-flex min-h-12 items-center justify-center rounded-2xl bg-[#176b3a] px-6 font-bold text-white transition hover:bg-[#115b30]">Ingatlanok böngészése</Link>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {favorites.map((post) => (
            <article key={post.id} className="overflow-hidden rounded-[28px] border border-[#e2ddd3] bg-white shadow-sm">
              <img src={post.imageUrl} alt={post.title} className="h-60 w-full object-cover" loading="lazy" decoding="async" />
              <div className="p-6">
                <h2 className="line-clamp-2 text-xl font-black leading-snug text-[#172019]">{post.title}</h2>
                <p className="mt-2 flex items-center gap-1.5 text-sm text-[#6c776f]"><MapPin size={15} className="text-[#176b3a]" />{post.city}{post.district ? `, ${post.district}` : ""}</p>
                <p className="mt-5 text-2xl font-black text-[#176b3a]">{formatPrice(post.price)}</p>
                <Link href={`/post/${post.id}`} className="mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-2xl bg-[#176b3a] px-6 font-bold text-white transition hover:bg-[#115b30]">Megnézem</Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
