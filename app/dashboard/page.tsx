"use client";

import { useEffect, useState } from "react";
import { auth, db } from "../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  query,
  where,
  getDocs,
  deleteDoc,
  doc,
} from "firebase/firestore";

type Post = {
  id: string;
  title: string;
  city: string;
  price: number;
  description: string;
  imageUrl: string;
};

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  // 🔥 USER FIGYELÉS
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });

    return () => unsubscribe();
  }, []);

  // 🔥 FETCH CSAK HA USER MEGVAN
  useEffect(() => {
    if (!user) return;

    fetchPosts(user.uid);
  }, [user]);

  // 🔥 FIRESTORE LEKÉRDEZÉS
  const fetchPosts = async (uid: string) => {
    try {
      const q = query(
        collection(db, "posts"),
        where("userId", "==", uid)
      );

      const snapshot = await getDocs(q);

      const data: Post[] = [];
      snapshot.forEach((docSnap) => {
        data.push({ id: docSnap.id, ...(docSnap.data() as any) });
      });

      setPosts(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // 🔥 TÖRLÉS
  const handleDelete = async (id: string) => {
    await deleteDoc(doc(db, "posts", id));
    setPosts((prev) => prev.filter((p) => p.id !== id));
  };

  // 🔄 LOADING
  if (loading) {
    return (
      <div className="text-white p-6">
        Betöltés...
      </div>
    );
  }

  return (
    <div className="p-6 text-white">
      <h1 className="text-2xl mb-6">Dashboard</h1>

      {posts.length === 0 && (
        <p>Nincs még feltöltött ingatlanod.</p>
      )}

      <div className="grid gap-6">
        {posts.map((post) => (
          <div
            key={post.id}
            className="bg-gray-900 rounded-xl overflow-hidden shadow-lg"
          >
            <img
              src={post.imageUrl}
              className="w-full h-60 object-cover"
            />

            <div className="p-4">
              <h2 className="text-xl font-bold">{post.title}</h2>
              <p className="text-gray-400">{post.city}</p>

              <p className="text-green-400 font-bold mt-2">
                {post.price.toLocaleString()} Ft
              </p>

              <p className="text-sm mt-2">{post.description}</p>

              <div className="mt-4 flex gap-2">
                <button className="bg-blue-600 px-3 py-1 rounded">
                  Edit
                </button>

                <button
                  onClick={() => handleDelete(post.id)}
                  className="bg-red-600 px-3 py-1 rounded"
                >
                  Törlés
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}