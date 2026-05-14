"use client";

import {
  useEffect,
  useState,
} from "react";

import Link from "next/link";

import {
  Heart,
  MapPin,
} from "lucide-react";

import {
  auth,
  db,
} from "@/app/lib/firebase";

import {
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";

interface Property {
  id: string;
  title: string;
  city: string;
  price: number;
  imageUrl: string;
}

export default function FavoritesPage() {

  const [favorites, setFavorites] =
    useState<Property[]>([]);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {

    const fetchFavorites = async () => {

      try {

        if (!auth.currentUser) {

          setLoading(false);
          return;

        }

        // FAVORITES
        const favoritesQuery = query(
          collection(db, "favorites"),

          where(
            "userId",
            "==",
            auth.currentUser.uid
          )
        );

        const favoritesSnapshot =
          await getDocs(favoritesQuery);

        const postIds =
          favoritesSnapshot.docs.map(
            (doc) => doc.data().postId
          );

        // EMPTY
        if (postIds.length === 0) {

          setFavorites([]);
          setLoading(false);

          return;

        }

        // LOAD POSTS
        const loadedPosts: Property[] = [];

        for (const postId of postIds) {

          const postQuery = query(
            collection(db, "posts"),

            where(
              "__name__",
              "==",
              postId
            )
          );

          const postSnapshot =
            await getDocs(postQuery);

          postSnapshot.forEach((doc) => {

            loadedPosts.push({
              id: doc.id,
              ...doc.data(),
            } as Property);

          });

        }

        setFavorites(loadedPosts);

      } catch (err) {

        console.error(err);

      } finally {

        setLoading(false);

      }

    };

    fetchFavorites();

  }, []);

  // LOADING
  if (loading) {

    return (
      <div
        className="
          min-h-screen
          bg-black
          text-white
          flex
          items-center
          justify-center
        "
      >
        Betöltés...
      </div>
    );

  }

  return (
    <div
      className="
        min-h-screen
        bg-black
        text-white
        p-6
      "
    >

      {/* TITLE */}
      <div className="mb-10">

        <div
          className="
            inline-flex
            items-center
            gap-2
            rounded-full
            border border-pink-500/20
            bg-pink-500/10
            px-5
            py-2
            text-pink-400
          "
        >

          <Heart className="h-4 w-4 fill-pink-500" />

          Kedvencek

        </div>

        <h1
          className="
            mt-6
            text-5xl
            font-black
          "
        >
          Mentett ingatlanok
        </h1>

      </div>

      {/* EMPTY */}
      {favorites.length === 0 ? (

        <div
          className="
            rounded-[32px]
            border border-zinc-800
            bg-zinc-900
            p-20
            text-center
          "
        >

          <Heart
            className="
              mx-auto
              h-16
              w-16
              text-pink-500
            "
          />

          <h2
            className="
              mt-6
              text-4xl
              font-black
            "
          >
            Nincsenek kedvencek
          </h2>

        </div>

      ) : (

        <div
          className="
            grid
            gap-8
            md:grid-cols-2
            xl:grid-cols-3
          "
        >

          {favorites.map((post) => (

            <div
              key={post.id}
              className="
                overflow-hidden
                rounded-[32px]
                border border-zinc-800
                bg-zinc-900
              "
            >

              {/* IMAGE */}
              <img
                src={post.imageUrl}
                alt={post.title}
                className="
                  h-64
                  w-full
                  object-cover
                "
              />

              {/* CONTENT */}
              <div className="p-6">

                {/* TITLE */}
                <h2
                  className="
                    text-3xl
                    font-black
                  "
                >
                  {post.title}
                </h2>

                {/* CITY */}
                <div
                  className="
                    mt-3
                    flex
                    items-center
                    gap-2
                    text-zinc-400
                  "
                >

                  <MapPin className="h-4 w-4 text-pink-500" />

                  {post.city}

                </div>

                {/* PRICE */}
                <div
                  className="
                    mt-6
                    text-4xl
                    font-black
                    text-emerald-400
                  "
                >
                  {post.price.toLocaleString()} Ft
                </div>

                {/* BUTTON */}
                <Link
                  href={`/post/${post.id}`}
                  className="
                    mt-8
                    inline-flex
                    rounded-2xl
                    bg-emerald-500
                    px-6
                    py-4
                    font-bold
                    text-white
                    transition
                    hover:bg-emerald-400
                  "
                >
                  Megnézem
                </Link>

              </div>

            </div>

          ))}

        </div>

      )}

    </div>
  );
}