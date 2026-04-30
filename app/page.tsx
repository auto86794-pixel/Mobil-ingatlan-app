"use client";

import { useEffect, useState } from "react";
import { db } from "./lib/firebase";
import { collection, getDocs } from "firebase/firestore";

import MobileBottomNav from "./components/MobileBottomNav";

import PropertyCard from "./components/property/PropertyCard";
import PropertyFilters from "./components/property/PropertyFilters";
import PropertyCardSkeleton from "./components/property/PropertyCardSkeleton";

type Post = {
  id: string;
  title: string;
  city: string;
  price: number;
  imageUrl: string;
  featured?: boolean;
};

export default function Home() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  // FILTERS
  const [city, setCity] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  // FAVORITES
  const [favorites, setFavorites] = useState<string[]>([]);

  // LOAD FAVORITES
  useEffect(() => {
    const fav = localStorage.getItem("favorites");

    if (fav) {
      setFavorites(JSON.parse(fav));
    }
  }, []);

  // FETCH POSTS
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const snapshot = await getDocs(collection(db, "posts"));

        const data: Post[] = [];

        snapshot.forEach((doc) => {
          data.push({
            id: doc.id,
            ...(doc.data() as Omit<Post, "id">),
          });
        });

        setPosts(data);
      } catch (error) {
        console.error("Hiba a betöltésnél:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  // FAVORITE TOGGLE
  const toggleFavorite = (id: string) => {
    let updatedFavorites: string[];

    if (favorites.includes(id)) {
      updatedFavorites = favorites.filter(
        (fav) => fav !== id
      );
    } else {
      updatedFavorites = [...favorites, id];
    }

    setFavorites(updatedFavorites);

    localStorage.setItem(
      "favorites",
      JSON.stringify(updatedFavorites)
    );
  };

  // FILTER POSTS
  const filteredPosts = posts
    .filter(
      (post) =>
        post.title &&
        post.city &&
        post.price &&
        post.imageUrl
    )
    .filter((post) => {
      const cityMatch = post.city
        .toLowerCase()
        .includes(city.toLowerCase());

      const priceMatch = maxPrice
        ? post.price <= Number(maxPrice)
        : true;

      return cityMatch && priceMatch;
    });

  // FEATURED POSTS
  const featuredPosts = filteredPosts.filter(
    (post) => post.featured
  );

  // NORMAL POSTS
  const normalPosts = filteredPosts.filter(
    (post) => !post.featured
  );

  // LOADING
  if (loading) {
    return (
      <>
        <MobileBottomNav />

        <main className="min-h-screen bg-black px-6 py-10">

          {/* HERO SKELETON */}
          <div
            className="
              mb-10
              h-64
              animate-pulse
              rounded-[32px]
              bg-zinc-900
            "
          />

          {/* CARD SKELETONS */}
          <div
            className="
              grid
              gap-8
              sm:grid-cols-1
              md:grid-cols-2
              xl:grid-cols-3
            "
          >

            {Array.from({ length: 6 }).map(
              (_, index) => (
                <PropertyCardSkeleton
                  key={index}
                />
              )
            )}

          </div>

        </main>
      </>
    );
  }

  return (
    <>
      <MobileBottomNav />

      <main className="min-h-screen bg-black text-white px-4 py-6 md:px-6 md:py-10">

        {/* HERO */}
        <section
          className="
            relative
            mb-10
            overflow-hidden
            rounded-[28px]
            border border-zinc-800
            bg-zinc-900
            min-h-[460px]
            md:min-h-[650px]
          "
        >

          {/* BACKGROUND IMAGE */}
          <div className="absolute inset-0">

            <img
              src="https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?q=80&w=2070&auto=format&fit=crop"
              className="
                h-full
                w-full
                object-cover
                object-[65%_center]
                md:object-center
              "
            />

            <div className="absolute inset-0 bg-black/75" />

            <div
              className="
                absolute
                inset-0
                bg-gradient-to-r
                from-black
                via-black/70
                to-transparent
              "
            />

          </div>

          {/* CONTENT */}
          <div
            className="
              relative
              z-10
              flex
              min-h-[460px]
              flex-col
              justify-center
              px-5
              py-12
              md:min-h-[650px]
              md:px-14
              md:py-20
            "
          >

            <div className="max-w-3xl">

              {/* BADGE */}
              <div
                className="
                  mb-5
                  inline-flex
                  items-center
                  gap-2
                  rounded-full
                  border border-emerald-500/20
                  bg-emerald-500/10
                  px-4
                  py-2
                  text-xs
                  text-emerald-400
                  backdrop-blur-xl
                  md:text-sm
                "
              >
                ✨ Premium Ingatlanplatform
              </div>

              {/* TITLE */}
              <h1
                className="
                  max-w-2xl
                  text-5xl
                  font-black
                  leading-[0.95]
                  tracking-tight
                  text-white
                  sm:text-6xl
                  md:text-7xl
                "
              >
                Találd meg álmaid otthonát Debrecenben
              </h1>

              {/* DESCRIPTION */}
              <p
                className="
                  mt-6
                  max-w-xl
                  text-base
                  leading-7
                  text-zinc-300
                  md:text-lg
                  md:leading-8
                "
              >
                Modern, prémium ingatlanok egy helyen.
                Gyors keresés, intelligens szűrés és
                exkluzív ajánlatok.
              </p>

            </div>

            {/* FILTER BOX */}
            <div className="mt-10 max-w-5xl">

              <PropertyFilters
                city={city}
                maxPrice={maxPrice}
                setCity={setCity}
                setMaxPrice={setMaxPrice}
                onReset={() => {
                  setCity("");
                  setMaxPrice("");
                }}
              />

            </div>

          </div>

        </section>

        {/* FEATURED */}
        {featuredPosts.length > 0 && (
          <section className="mb-14">

            <div className="mb-6 flex items-center justify-between">

              <h2 className="text-2xl font-bold md:text-3xl">
                ⭐ Kiemelt ingatlanok
              </h2>

            </div>

            <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">

              {featuredPosts.map((post) => (
                <PropertyCard
                  key={post.id}
                  id={post.id}
                  title={post.title}
                  city={post.city}
                  price={post.price}
                  imageUrl={post.imageUrl}
                  featured={post.featured}
                  isFavorite={favorites.includes(post.id)}
                  onToggleFavorite={() =>
                    toggleFavorite(post.id)
                  }
                />
              ))}

            </div>

          </section>
        )}

        {/* EMPTY */}
        {filteredPosts.length === 0 && (
          <div
            className="
              rounded-3xl
              border border-zinc-800
              bg-zinc-900
              p-10
              text-center
              text-zinc-400
            "
          >
            Nincs találat 😢
          </div>
        )}

        {/* NORMAL POSTS */}
        <section>

          <div className="mb-6 flex items-center justify-between">

            <h2 className="text-2xl font-bold md:text-3xl">
              🏡 Ingatlan kínálatunk
            </h2>

            <span className="text-sm text-zinc-400 md:text-base">
              {normalPosts.length} találat
            </span>

          </div>

          <div className="grid gap-8 sm:grid-cols-1 md:grid-cols-2 xl:grid-cols-3">

            {normalPosts.map((post) => (
              <PropertyCard
                key={post.id}
                id={post.id}
                title={post.title}
                city={post.city}
                price={post.price}
                imageUrl={post.imageUrl}
                featured={post.featured}
                isFavorite={favorites.includes(post.id)}
                onToggleFavorite={() =>
                  toggleFavorite(post.id)
                }
              />
            ))}

          </div>

        </section>

      </main>
    </>
  );
}