"use client";

import { useEffect, useState } from "react";
import { db } from "./lib/firebase";
import { collection, getDocs } from "firebase/firestore";

export default function Home() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // 🔥 PUBLIC FETCH (NINCS user filter!)
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const snapshot = await getDocs(collection(db, "posts"));

        const data: any[] = [];
        snapshot.forEach((doc) => {
          data.push({ id: doc.id, ...doc.data() });
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

      {/* EMPTY */}
      {posts.length === 0 && (
        <p className="text-gray-400">
          Nincs még feltöltött ingatlan.
        </p>
      )}

      {/* GRID */}
      <div className="grid sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {posts.map((post) => (
          <div
            key={post.id}
            className="bg-gray-900 rounded-xl overflow-hidden shadow-lg hover:scale-[1.03] hover:shadow-2xl transition"
          >
            {post.imageUrl && (
              <img
                src={post.imageUrl}
                className="h-48 w-full object-cover"
              />
            )}

            <div className="p-4">
              <h2 className="text-xl font-bold mb-1">
                {post.title}
              </h2>

              <p className="text-gray-400 mb-1">
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