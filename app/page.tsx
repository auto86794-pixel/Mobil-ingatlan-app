"use client";

import { useEffect, useState } from "react";
import { db } from "./lib/firebase";
import { collection, getDocs } from "firebase/firestore";

type Post = {
  id: string;
  title: string;
  city: string;
  price: number;
  imageUrl: string;
};

export default function Home() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  // 🔍 FILTER
  const [city, setCity] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  // ❤️ FAVORITES
  const [favorites, setFavorites] = useState<string[]>([]);

  // 🔥 LOAD FAVORITES
  useEffect(() => {
    const fav = localStorage.getItem("favorites");
    if (fav) setFavorites(JSON.parse(fav));
  }, []);

  // 🔥 FETCH POSTS
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const snapshot = await getDocs(collection(db, "posts"));

        const data: Post[] = [];
        snapshot.forEach((doc) => {
          data.push({ id: doc.id, ...(doc.data() as any) });
        });

        setPosts(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  // 🔥 TOGGLE FAVORITE
  const toggleFavorite = (id: string) => {
    let updated;

    if (favorites.includes(id)) {
      updated = favorites.filter((f) => f !== id);
    } else {
      updated = [...favorites, id];
    }

    setFavorites(updated);
    localStorage.setItem("favorites", JSON.stringify(updated));
  };

  // 🔍 FILTER LOGIKA
  const filteredPosts = posts
    .filter(
      (post) =>
        post.title &&
        post.price &&
        post.imageUrl &&
        post.city
    )
    .filter((post) => {
      const matchCity = post.city
        ?.toLowerCase()
        .includes(city.toLowerCase());

      const matchPrice = maxPrice
        ? post.price <= Number(maxPrice)
        : true;

      return matchCity && matchPrice;
    });

  // ⏳ LOADING
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950 text-white">
        Betöltés...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">

      <h1 className="text-3xl font-bold mb-6">
        🏠 Elérhető ingatlanok
      </h1>

      {/* 🔍 SEARCH */}
      <div className="flex flex-col md:flex-row gap-3 mb-6">

        <input
          placeholder="🔍 Város"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          className="bg-gray-800 p-2 rounded w-full md:w-1/3"
        />

        <input
          type="number"
          placeholder="💰 Max ár"
          value={maxPrice}
          onChange={(e) => setMaxPrice(e.target.value)}
          className="bg-gray-800 p-2 rounded w-full md:w-1/3"
        />

        <button
          onClick={() => {
            setCity("");
            setMaxPrice("");
          }}
          className="bg-gray-700 px-4 py-2 rounded hover:bg-gray-600"
        >
          Reset
        </button>

      </div>

      {/* EMPTY */}
      {filteredPosts.length === 0 && (
        <p className="text-gray-400">Nincs találat 😢</p>
      )}

      {/* GRID */}
      <div className="grid sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredPosts.map((post) => (
          <div
            key={post.id}
            className="bg-gray-900 rounded-xl overflow-hidden shadow-lg hover:scale-[1.03] hover:shadow-2xl transition"
          >
            <img
              src={post.imageUrl}
              className="h-48 w-full object-cover"
            />

            <div className="p-4">

              {/* ❤️ HEADER */}
              <div className="flex justify-between items-center mb-1">
                <h2 className="text-xl font-bold">
                  {post.title}
                </h2>

                <button
                  onClick={() => toggleFavorite(post.id)}
                  className="text-2xl"
                >
                  {favorites.includes(post.id) ? "❤️" : "🤍"}
                </button>
              </div>

              <p className="text-gray-400">
                {post.city}
              </p>

              <p className="text-green-400 text-lg mb-2">
                {post.price.toLocaleString()} Ft
              </p>

              <a
                href={`/post/${post.id}`}
                className="inline-block bg-green-600 px-3 py-1 rounded hover:bg-green-700 transition"
              >
                👁 Megnézem
              </a>

            </div>
          </div>
        ))}
      </div>

    </div>
  );
}