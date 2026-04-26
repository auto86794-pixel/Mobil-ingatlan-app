"use client";

import { useEffect, useState } from "react";
import { db, storage, auth } from "./lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  query,
  where,
  getDocs,
  deleteDoc,
  doc,
} from "firebase/firestore";

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);

  // 🔄 fetch
  const fetchPosts = async (uid: string) => {
    const q = query(
      collection(db, "posts"),
      where("userId", "==", uid)
    );

    const querySnapshot = await getDocs(q);
    const data: any[] = [];

    querySnapshot.forEach((docSnap) => {
      data.push({ id: docSnap.id, ...docSnap.data() });
    });

    setPosts(data);
  };

  // 👤 auth
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      if (u) {
        setUser(u);
        fetchPosts(u.uid);
      } else {
        window.location.href = "/login";
      }
    });

    return () => unsubscribe();
  }, []);

  // 🗑️ törlés
  const handleDelete = async (id: string) => {
    if (!confirm("Biztos törlöd?")) return;

    await deleteDoc(doc(db, "posts", id));

    // frissítés
    setPosts((prev) => prev.filter((p) => p.id !== id));
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      <h1 className="text-3xl font-bold mb-6">📊 Dashboard</h1>

      {user && (
        <p className="mb-6 text-gray-400">
          Bejelentkezve: {user.email}
        </p>
      )}

      {/* EMPTY */}
      {posts.length === 0 && (
        <div className="text-center text-gray-500 mt-20">
          <p>Nincs még feltöltött ingatlanod 😢</p>
        </div>
      )}

      {/* GRID */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {posts.map((post) => (
          <div
            key={post.id}
            className="bg-gray-800 rounded-xl overflow-hidden shadow-lg"
          >
            {/* KÉP */}
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

              <p className="text-sm text-gray-400 mb-4">
                {post.description}
              </p>

              {/* GOMBOK */}
              <div className="flex gap-2">
                <button
                  onClick={() => handleDelete(post.id)}
                  className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded"
                >
                  🗑️ Törlés
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}