"use client";

import { useEffect, useState } from "react";

import {
  collection,
  getDocs,
} from "firebase/firestore";

import { db } from "../lib/firebase";

import Navbar from "../components/Navbar";
import MobileBottomNav from "../components/MobileBottomNav";

import PropertyCard from "../components/property/PropertyCard";

type Post = {
  id: string;
  title: string;
  city: string;
  price: number;
  imageUrl: string;
  featured?: boolean;
};

export default function FavoritesPage() {
  const [posts, setPosts] = useState<Post[]>([]);

  const [favorites, setFavorites] = useState<string[]>([]);

  const [loading, setLoading] = useState(true);

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
        const snapshot = await getDocs(
          collection(db, "posts")
        );

        const data: Post[] = [];

        snapshot.forEach((doc) => {
          data.push({
            id: doc.id,
            ...(doc.data() as Omit<Post, "id">),
          });
        });

        setPosts(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  // TOGGLE FAVORITE
  const toggleFavorite = (id: string) => {
    let updated: string[];

    if (favorites.includes(id)) {
      updated = favorites.filter(
        (fav) => fav !== id
      );
    } else {
      updated = [...favorites, id];
    }

    setFavorites(updated);

    localStorage.setItem(
      "favorites",
      JSON.stringify(updated)
    );
  };

  // FILTERED FAVORITES
  const favoritePosts = posts.filter((post) =>
    favorites.includes(post.id)
  );

  // LOADING
  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        Betöltés...
      </div>
    );
  }

  return (
    <>
      
      <MobileBottomNav />

      <main
        className="
          min-h-screen
          bg-black
          text-white
          px-6
          py-10
          pb-32
        "
      >

        {/* HERO */}
        <section
          className="
            mb-12
            rounded-[32px]
            border border-zinc-800
            bg-gradient-to-br
            from-zinc-900
            to-black
            p-10
          "
        >

          <div
            className="
              inline-flex
              items-center
              gap-2
              rounded-full
              border border-pink-500/20
              bg-pink-500/10
              px-4
              py-2
              text-sm
              text-pink-400
            "
          >
            ❤️ Kedvenc ingatlanok
          </div>

          <h1
            className="
              mt-6
              text-5xl
              font-black
              tracking-tight
            "
          >
            Mentett ingatlanjaid
          </h1>

          <p
            className="
              mt-4
              max-w-2xl
              text-lg
              text-zinc-400
            "
          >
            Gyors hozzáférés a kedvenc
            prémium ingatlanjaidhoz.
          </p>

        </section>

        {/* EMPTY */}
        {favoritePosts.length === 0 && (
          <div
            className="
              flex
              flex-col
              items-center
              justify-center
              rounded-3xl
              border border-zinc-800
              bg-zinc-900
              p-16
              text-center
            "
          >

            <div className="text-7xl">
              💔
            </div>

            <h2
              className="
                mt-6
                text-3xl
                font-bold
              "
            >
              Nincsenek mentett ingatlanok
            </h2>

            <p
              className="
                mt-4
                max-w-md
                text-zinc-400
              "
            >
              Jelölj meg ingatlanokat
              kedvencként és itt jelennek meg.
            </p>

          </div>
        )}

        {/* FAVORITES GRID */}
        {favoritePosts.length > 0 && (
          <section>

            <div
              className="
                mb-6
                flex
                items-center
                justify-between
              "
            >

              <h2
                className="
                  text-3xl
                  font-bold
                "
              >
                ❤️ Mentett ingatlanok
              </h2>

              <span className="text-zinc-400">
                {favoritePosts.length} mentett
              </span>

            </div>

            <div
              className="
                grid
                gap-8
                sm:grid-cols-1
                md:grid-cols-2
                xl:grid-cols-3
              "
            >

              {favoritePosts.map((post) => (
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

      </main>
    </>
  );
}