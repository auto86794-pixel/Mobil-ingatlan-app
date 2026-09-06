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
      <main className="min-h-screen bg-[#f7f4ee] px-4 py-6 md:px-6 md:py-10">
        <div className="mx-auto mb-10 h-64 max-w-[1500px] animate-pulse rounded-[32px] bg-[#ece7de]" />
        <div className="mx-auto grid max-w-[1500px] gap-8 sm:grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
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
    description: "Eladó és kiadó ingatlanok Debrecenben egyszerű kereséssel és átlátható információkkal.",
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
      <main className="mx-auto min-h-screen max-w-[1500px] px-4 py-5 md:px-6 md:py-8">
        <section className="relative mb-10 overflow-hidden rounded-[34px] border border-[#e2ddd3] bg-white shadow-[0_28px_80px_rgba(55,47,33,.10)]">
          <div className="grid min-h-[610px] lg:grid-cols-[1.05fr_.95fr]">
            <div className="relative z-10 flex flex-col justify-center px-6 py-12 sm:px-10 md:px-14 lg:px-16">
              <div className="mb-6 inline-flex w-fit items-center gap-3 text-xs font-bold uppercase tracking-[0.22em] text-[#a1813a]">
                <span className="h-px w-12 bg-[#c7a95d]" /> DebrecenHomes
              </div>
              <h1 className="max-w-3xl text-5xl font-black leading-[.96] tracking-[-0.055em] text-[#172019] sm:text-6xl lg:text-7xl">
                Találd meg<br />az otthonod <span className="text-[#176b3a]">Debrecenben.</span>
              </h1>
              <p className="mt-7 max-w-2xl text-lg leading-8 text-[#667169] md:text-xl">
                Eladó és kiadó ingatlanok egyszerű kereséssel, átlátható információkkal, egy helyen.
              </p>

              <div className="mt-9 grid max-w-2xl gap-3 sm:grid-cols-3">
                <div className="rounded-2xl bg-[#fbf7ef] p-4"><p className="font-bold text-[#263129]">Gyors keresés</p><p className="mt-1 text-sm text-[#7b857e]">Szűrj a fontos szempontokra.</p></div>
                <div className="rounded-2xl bg-[#f2f7f3] p-4"><p className="font-bold text-[#263129]">Kedvencek</p><p className="mt-1 text-sm text-[#7b857e]">Mentsd el, ami igazán tetszik.</p></div>
                <div className="rounded-2xl bg-[#fbf7ef] p-4"><p className="font-bold text-[#263129]">Átlátható adatok</p><p className="mt-1 text-sm text-[#7b857e]">A lényeg egy helyen.</p></div>
              </div>
            </div>

            <div className="relative min-h-[360px] overflow-hidden lg:min-h-full">
              <img
                src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=85&w=1800&auto=format&fit=crop"
                alt="Világos, modern otthon"
                className="absolute inset-0 h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-white via-white/15 to-transparent lg:from-white/85 lg:via-white/10" />
              <div className="absolute bottom-7 left-7 rounded-2xl border border-white/70 bg-white/90 px-5 py-4 shadow-xl backdrop-blur-xl lg:left-8">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#a1813a]">Debrecen</p>
                <p className="mt-1 text-lg font-black text-[#172019]">Otthon. Egyszerűbben.</p>
              </div>
            </div>
          </div>

          <div className="relative z-20 border-t border-[#eee8df] bg-[#faf8f4] p-4 md:p-6">
            <PropertyFilters
              filters={filters}
              setFilters={setFilters}
              options={options}
              resultCount={filteredPosts.length}
              onReset={() => setFilters(emptyFilters)}
            />
          </div>
        </section>

        <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#a1813a]">Aktív kínálat</p>
            <h2 className="mt-1 text-2xl font-black tracking-tight text-[#172019] md:text-3xl">{filteredPosts.length} ingatlan felel meg</h2>
          </div>
          <p className="text-sm text-[#7d877f]">Csak az aktuálisan elérhető hirdetések jelennek meg.</p>
        </div>

        {featuredPosts.length > 0 && (
          <section className="mb-14">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-[#172019] md:text-3xl">Kiemelt ingatlanok</h2>
              <span className="text-sm font-semibold text-[#176b3a]">{featuredPosts.length} kiemelt</span>
            </div>
            <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
              {featuredPosts.map((post) => (
                <PropertyCard key={post.id} id={post.id} title={post.title} city={post.city} district={post.district} price={post.price} area={post.area} rooms={post.rooms} propertyType={post.propertyType} imageUrl={post.imageUrl} phone={post.phone} featured={post.featured} isFavorite={favorites.includes(post.id)} onToggleFavorite={() => toggleFavorite(post.id)} />
              ))}
            </div>
          </section>
        )}

        {filteredPosts.length === 0 && (
          <div className="rounded-[28px] border border-[#e2ddd3] bg-white p-10 text-center shadow-sm">
            <p className="text-xl font-semibold text-[#172019]">Nincs találat a megadott feltételekkel.</p>
            <p className="mt-2 text-[#6c776f]">Próbálj meg kevesebb szűrőt használni.</p>
            <button type="button" onClick={() => setFilters(emptyFilters)} className="mt-6 rounded-2xl bg-[#176b3a] px-5 py-3 font-bold text-white hover:bg-[#115b30]">Összes szűrő törlése</button>
          </div>
        )}

        {normalPosts.length > 0 && (
          <section>
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-[#172019] md:text-3xl">Ingatlan kínálatunk</h2>
              <span className="text-sm text-[#6c776f] md:text-base">{normalPosts.length} további találat</span>
            </div>
            <div className="grid gap-8 sm:grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
              {normalPosts.map((post) => (
                <PropertyCard key={post.id} id={post.id} title={post.title} city={post.city} district={post.district} price={post.price} area={post.area} rooms={post.rooms} propertyType={post.propertyType} imageUrl={post.imageUrl} phone={post.phone} featured={post.featured} isFavorite={favorites.includes(post.id)} onToggleFavorite={() => toggleFavorite(post.id)} />
              ))}
            </div>
          </section>
        )}
      </main>
    </>
  );
}
