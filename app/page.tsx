"use client";

import { useEffect, useMemo, useState } from "react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  where,
} from "firebase/firestore";

import PropertyCard from "./components/property/PropertyCard";
import PropertyCardSkeleton from "./components/property/PropertyCardSkeleton";
import PropertyFilters, {
  type SearchFilters,
} from "./components/property/PropertyFilters";
import { auth, db } from "./lib/firebase";
import { propertyFromFirestore, type PropertyWithId } from "./lib/types";

const emptyFilters: SearchFilters = {
  city: "",
  district: "",
  propertyType: "",
  minPrice: "",
  maxPrice: "",
  minArea: "",
  maxArea: "",
  minRooms: "",
  condition: "",
  parking: "",
  balcony: "",
  heating: "",
  sort: "featured",
};

const includesText = (value: string, filter: string) =>
  value.toLocaleLowerCase("hu-HU").includes(filter.toLocaleLowerCase("hu-HU"));

const timestampToMillis = (value: unknown) => {
  if (value && typeof value === "object" && "toMillis" in value) {
    const toMillis = (value as { toMillis?: () => number }).toMillis;
    if (typeof toMillis === "function") return toMillis.call(value);
  }
  if (value instanceof Date) return value.getTime();
  return 0;
};

const uniqueValues = (posts: PropertyWithId[], key: keyof PropertyWithId) =>
  Array.from(
    new Set(
      posts
        .map((post) => post[key])
        .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
        .map((value) => value.trim())
    )
  ).sort((a, b) => a.localeCompare(b, "hu-HU"));

export default function Home() {
  const [posts, setPosts] = useState<PropertyWithId[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<SearchFilters>(emptyFilters);
  const [favorites, setFavorites] = useState<string[]>([]);

  useEffect(() => {
    const loadFavorites = async () => {
      try {
        if (!auth.currentUser) return;

        const q = query(
          collection(db, "favorites"),
          where("userId", "==", auth.currentUser.uid)
        );
        const snapshot = await getDocs(q);
        setFavorites(snapshot.docs.map((item) => item.data().postId as string));
      } catch (error) {
        console.error("Kedvencek betöltési hiba:", error);
      }
    };

    loadFavorites();
  }, []);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const snapshot = await getDocs(collection(db, "posts"));
        const data = snapshot.docs.map((item) =>
          propertyFromFirestore(item.id, item.data() as Record<string, unknown>)
        );
        setPosts(data);
      } catch (error) {
        console.error("Hiba az ingatlanok betöltésénél:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  const toggleFavorite = async (id: string) => {
    try {
      if (!auth.currentUser) {
        alert("Először jelentkezz be!");
        return;
      }

      const userId = auth.currentUser.uid;
      const favoritesRef = collection(db, "favorites");
      const q = query(
        favoritesRef,
        where("userId", "==", userId),
        where("postId", "==", id)
      );
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        await deleteDoc(doc(db, "favorites", snapshot.docs[0].id));
        setFavorites((prev) => prev.filter((favoriteId) => favoriteId !== id));
      } else {
        await addDoc(favoritesRef, { userId, postId: id });
        setFavorites((prev) => [...prev, id]);
      }
    } catch (error) {
      console.error("Kedvenc módosítási hiba:", error);
    }
  };

  const activePosts = useMemo(
    () =>
      posts.filter(
        (post) =>
          post.status === "active" &&
          Boolean(post.title && post.city && post.price > 0 && post.imageUrl)
      ),
    [posts]
  );

  const options = useMemo(
    () => ({
      districts: uniqueValues(activePosts, "district"),
      propertyTypes: uniqueValues(activePosts, "propertyType"),
      conditions: uniqueValues(activePosts, "condition"),
      parking: uniqueValues(activePosts, "parking"),
      balconies: uniqueValues(activePosts, "balcony"),
      heating: uniqueValues(activePosts, "heating"),
    }),
    [activePosts]
  );

  const filteredPosts = useMemo(() => {
    const result = activePosts.filter((post) => {
      if (filters.city && !includesText(post.city, filters.city)) return false;
      if (filters.district && post.district !== filters.district) return false;
      if (filters.propertyType && post.propertyType !== filters.propertyType) return false;
      if (filters.condition && post.condition !== filters.condition) return false;
      if (filters.parking && post.parking !== filters.parking) return false;
      if (filters.balcony && post.balcony !== filters.balcony) return false;
      if (filters.heating && post.heating !== filters.heating) return false;

      if (filters.minPrice && post.price < Number(filters.minPrice)) return false;
      if (filters.maxPrice && post.price > Number(filters.maxPrice)) return false;
      if (filters.minArea && post.area < Number(filters.minArea)) return false;
      if (filters.maxArea && post.area > Number(filters.maxArea)) return false;
      if (filters.minRooms && post.rooms < Number(filters.minRooms)) return false;

      return true;
    });

    return result.sort((a, b) => {
      if (filters.sort === "priceAsc") return a.price - b.price;
      if (filters.sort === "priceDesc") return b.price - a.price;
      if (filters.sort === "newest") {
        return timestampToMillis(b.createdAt) - timestampToMillis(a.createdAt);
      }

      if (a.featured !== b.featured) return a.featured ? -1 : 1;
      return timestampToMillis(b.createdAt) - timestampToMillis(a.createdAt);
    });
  }, [activePosts, filters]);

  const featuredPosts = filteredPosts.filter((post) => post.featured);
  const normalPosts = filteredPosts.filter((post) => !post.featured);

  if (loading) {
    return (
      <main className="min-h-screen px-4 py-6 md:px-6 md:py-10">
        <div className="mb-10 h-64 animate-pulse rounded-[32px] bg-zinc-900" />
        <div className="grid gap-8 sm:grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <PropertyCardSkeleton key={index} />
          ))}
        </div>
      </main>
    );
  }

  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "DebrecenHomes",
    url: "https://debrecenhomes.hu",
    description: "Eladó és kiadó ingatlanok Debrecenben részletes keresővel.",
    inLanguage: "hu-HU",
    potentialAction: {
      "@type": "SearchAction",
      target: "https://debrecenhomes.hu/?city={search_term_string}",
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
      />
      <main className="mx-auto min-h-screen max-w-[1500px] px-4 py-5 text-white md:px-6 md:py-8">
      <section className="relative mb-10 min-h-[500px] overflow-hidden rounded-[32px] border border-white/10 bg-zinc-900 shadow-[0_30px_100px_rgba(0,0,0,.38)] md:min-h-[650px]">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?q=80&w=2070&auto=format&fit=crop"
            alt="Modern debreceni otthon"
            className="h-full w-full object-cover object-[65%_center] md:object-center"
          />
          <div className="absolute inset-0 bg-black/62" />
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/65 to-black/10" />
        </div>

        <div className="relative z-10 flex min-h-[520px] flex-col justify-center px-5 py-12 md:min-h-[680px] md:px-14 md:py-20">
          <div className="max-w-3xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-400/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] text-emerald-300 backdrop-blur-xl md:text-sm">
              Debrecen • válogatott ingatlanok
            </div>
            <h1 className="max-w-3xl text-4xl font-black leading-[0.98] tracking-[-0.04em] text-white sm:text-6xl md:text-7xl">
              Otthon Debrecenben. Átláthatóbban.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-7 text-zinc-300 md:text-lg md:leading-8">
              Keress eladó és kiadó ingatlanok között részletes szűrőkkel, átlátható adatokkal és közvetlen kapcsolatfelvétellel.
            </p>
          </div>

          <div className="mt-10 max-w-6xl">
            <PropertyFilters
              filters={filters}
              setFilters={setFilters}
              options={options}
              resultCount={filteredPosts.length}
              onReset={() => setFilters(emptyFilters)}
            />
          </div>
        </div>
      </section>

      <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-300">Aktív kínálat</p>
          <h2 className="mt-1 text-2xl font-black tracking-tight md:text-3xl">{filteredPosts.length} ingatlan felel meg</h2>
        </div>
        <p className="text-sm text-zinc-500">Csak az aktuálisan elérhető hirdetések jelennek meg.</p>
      </div>

      {featuredPosts.length > 0 && (
        <section className="mb-14">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-bold md:text-3xl">Kiemelt ingatlanok</h2>
            <span className="text-sm text-emerald-400">{featuredPosts.length} kiemelt</span>
          </div>
          <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
            {featuredPosts.map((post) => (
              <PropertyCard
                key={post.id}
                id={post.id}
                title={post.title}
                city={post.city}
                district={post.district}
                price={post.price}
                area={post.area}
                rooms={post.rooms}
                propertyType={post.propertyType}
                imageUrl={post.imageUrl}
                phone={post.phone}
                featured={post.featured}
                isFavorite={favorites.includes(post.id)}
                onToggleFavorite={() => toggleFavorite(post.id)}
              />
            ))}
          </div>
        </section>
      )}

      {filteredPosts.length === 0 && (
        <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-10 text-center">
          <p className="text-xl font-semibold text-white">Nincs találat a megadott feltételekkel.</p>
          <p className="mt-2 text-zinc-400">Próbálj meg kevesebb szűrőt használni.</p>
          <button
            type="button"
            onClick={() => setFilters(emptyFilters)}
            className="mt-6 rounded-2xl bg-emerald-500 px-5 py-3 font-bold text-zinc-950 hover:bg-emerald-400"
          >
            Összes szűrő törlése
          </button>
        </div>
      )}

      {normalPosts.length > 0 && (
        <section>
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-bold md:text-3xl">Ingatlan kínálatunk</h2>
            <span className="text-sm text-zinc-400 md:text-base">{normalPosts.length} további találat</span>
          </div>
          <div className="grid gap-8 sm:grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
            {normalPosts.map((post) => (
              <PropertyCard
                key={post.id}
                id={post.id}
                title={post.title}
                city={post.city}
                district={post.district}
                price={post.price}
                area={post.area}
                rooms={post.rooms}
                propertyType={post.propertyType}
                imageUrl={post.imageUrl}
                phone={post.phone}
                featured={post.featured}
                isFavorite={favorites.includes(post.id)}
                onToggleFavorite={() => toggleFavorite(post.id)}
              />
            ))}
          </div>
        </section>
      )}
      </main>
    </>
  );
}
