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
  updateDoc,
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

  // 🔥 EDIT MODAL STATE
  const [editingPost, setEditingPost] = useState<Post | null>(null);

  // 🔥 USER FIGYELÉS
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });
    return () => unsubscribe();
  }, []);

  // 🔥 POSTS BETÖLTÉS
  useEffect(() => {
    if (!user) return;
    fetchPosts(user.uid);
  }, [user]);

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

  // 🔥 DELETE
  const handleDelete = async (id: string) => {
    await deleteDoc(doc(db, "posts", id));
    setPosts((prev) => prev.filter((p) => p.id !== id));
  };

  // 🔥 UPDATE
  const handleUpdate = async () => {
    if (!editingPost) return;

    try {
      const ref = doc(db, "posts", editingPost.id);

      await updateDoc(ref, {
        title: editingPost.title,
        city: editingPost.city,
        price: editingPost.price,
        description: editingPost.description,
      });

      setPosts((prev) =>
        prev.map((p) =>
          p.id === editingPost.id ? editingPost : p
        )
      );

      setEditingPost(null);
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return <div className="text-white p-6">Betöltés...</div>;
  }

  return (
    <div className="p-6 text-white">
      <h1 className="text-3xl mb-6 font-bold">Dashboard</h1>

      {posts.length === 0 && (
        <p className="text-gray-400">
          Nincs még feltöltött ingatlanod.
        </p>
      )}

      {/* GRID */}
      <div className="grid sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {posts.map((post) => (
          <div
            key={post.id}
            className="bg-gray-900 rounded-xl overflow-hidden shadow-lg hover:scale-[1.03] hover:shadow-2xl transition duration-300"
          >
            {/* KÉP */}
            <img
              src={post.imageUrl}
              className="w-full h-48 object-cover"
            />

            <div className="p-4">
              <h2 className="text-lg font-bold">{post.title}</h2>

              <p className="text-gray-400 text-sm">{post.city}</p>

              <p className="text-green-400 font-bold mt-2">
                {post.price.toLocaleString()} Ft
              </p>

              <p className="text-sm mt-2 line-clamp-2">
                {post.description}
              </p>

              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => setEditingPost(post)}
                  className="bg-blue-600 px-3 py-1 rounded hover:bg-blue-700 transition"
                >
                  Edit
                </button>

                <button
                  onClick={() => handleDelete(post.id)}
                  className="bg-red-600 px-3 py-1 rounded hover:bg-red-700 transition"
                >
                  Törlés
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 🔥 MODAL */}
      {editingPost && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur flex items-center justify-center z-50">
          <div className="bg-gray-900 p-6 rounded-xl w-full max-w-md shadow-2xl">

            <h2 className="text-xl font-bold mb-4">
              Ingatlan szerkesztése
            </h2>

            <input
              className="w-full p-2 mb-2 bg-gray-800 rounded"
              value={editingPost.title}
              onChange={(e) =>
                setEditingPost({
                  ...editingPost,
                  title: e.target.value,
                })
              }
              placeholder="Cím"
            />

            <input
              className="w-full p-2 mb-2 bg-gray-800 rounded"
              value={editingPost.city}
              onChange={(e) =>
                setEditingPost({
                  ...editingPost,
                  city: e.target.value,
                })
              }
              placeholder="Város"
            />

            <input
              type="number"
              className="w-full p-2 mb-2 bg-gray-800 rounded"
              value={editingPost.price}
              onChange={(e) =>
                setEditingPost({
                  ...editingPost,
                  price: Number(e.target.value),
                })
              }
              placeholder="Ár"
            />

            <textarea
              className="w-full p-2 mb-4 bg-gray-800 rounded"
              value={editingPost.description}
              onChange={(e) =>
                setEditingPost({
                  ...editingPost,
                  description: e.target.value,
                })
              }
              placeholder="Leírás"
            />

            <div className="flex gap-2">
              <button
                onClick={handleUpdate}
                className="bg-green-600 px-4 py-2 rounded hover:bg-green-700"
              >
                Mentés
              </button>

              <button
                onClick={() => setEditingPost(null)}
                className="bg-gray-700 px-4 py-2 rounded"
              >
                Mégse
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}