"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { auth, db, storage } from "../lib/firebase";
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
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [editingPost, setEditingPost] = useState<any>(null);

  const [editTitle, setEditTitle] = useState("");
  const [editCity, setEditCity] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editImage, setEditImage] = useState<File | null>(null);

  const fetchPosts = async (uid: string) => {
    const q = query(collection(db, "posts"), where("userId", "==", uid));
    const snapshot = await getDocs(q);
    const data: any[] = [];

    snapshot.forEach((docSnap) => {
      data.push({ id: docSnap.id, ...docSnap.data() });
    });

    setPosts(data);
  };

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        window.location.href = "/login";
        return;
      }

      setUser(u);
      await fetchPosts(u.uid);
    });

    return () => unsub();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Biztos törlöd?")) return;

    await deleteDoc(doc(db, "posts", id));
    setPosts((prev) => prev.filter((p) => p.id !== id));
  };

  const startEdit = (post: any) => {
    setEditingPost(post);
    setEditTitle(post.title || "");
    setEditCity(post.city || "");
    setEditPrice(String(post.price || ""));
    setEditDescription(post.description || "");
    setEditImage(null);
  };

  const handleUpdate = async () => {
    if (!editingPost) return;

    let newImageUrl = editingPost.imageUrl || "";

    if (editImage) {
      const imageRef = ref(
        storage,
        `images/${Date.now()}-${editImage.name}`
      );

      await uploadBytes(imageRef, editImage);
      newImageUrl = await getDownloadURL(imageRef);
    }

    await updateDoc(doc(db, "posts", editingPost.id), {
      title: editTitle,
      city: editCity,
      price: Number(editPrice),
      description: editDescription,
      imageUrl: newImageUrl,
    });

    setPosts((prev) =>
      prev.map((p) =>
        p.id === editingPost.id
          ? {
              ...p,
              title: editTitle,
              city: editCity,
              price: Number(editPrice),
              description: editDescription,
              imageUrl: newImageUrl,
            }
          : p
      )
    );

    setEditingPost(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-slate-950 to-gray-900 text-white">
      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-4xl font-bold">📊 Dashboard</h1>
          <p className="text-gray-400 mt-2">
            Bejelentkezve: {user?.email}
          </p>
        </div>

        {posts.length === 0 && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-10 text-center text-gray-400">
            Nincs még feltöltött ingatlanod.
          </div>
        )}

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post) => (
            <div
              key={post.id}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl hover:scale-[1.02] transition"
            >
              {post.imageUrl && (
                <img
                  src={post.imageUrl}
                  alt={post.title}
                  className="h-56 w-full object-cover"
                />
              )}

              <div className="p-5">
                <h2 className="text-2xl font-bold">{post.title}</h2>
                <p className="text-gray-400">{post.city}</p>

                <p className="text-green-400 text-xl font-semibold mt-2">
                  {Number(post.price).toLocaleString("hu-HU")} Ft
                </p>

                <p className="text-gray-400 text-sm mt-3 mb-5">
                  {post.description}
                </p>

                <div className="flex flex-wrap gap-2">
                  <Link
                    href={`/post/${post.id}`}
                    className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg"
                  >
                    Megnézem
                  </Link>

                  <button
                    onClick={() => startEdit(post)}
                    className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg"
                  >
                    ✏️ Edit
                  </button>

                  <button
                    onClick={() => handleDelete(post.id)}
                    className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg"
                  >
                    🗑️ Törlés
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {editingPost && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 border border-white/10 rounded-3xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-2xl font-bold mb-4">✏️ Ingatlan szerkesztése</h2>

            {editingPost.imageUrl && (
              <img
                src={editingPost.imageUrl}
                className="h-40 w-full object-cover rounded-xl mb-4"
              />
            )}

            <input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              placeholder="Cím"
              className="w-full mb-2 p-3 rounded-xl bg-gray-800"
            />

            <input
              value={editCity}
              onChange={(e) => setEditCity(e.target.value)}
              placeholder="Város"
              className="w-full mb-2 p-3 rounded-xl bg-gray-800"
            />

            <input
              type="number"
              value={editPrice}
              onChange={(e) => setEditPrice(e.target.value)}
              placeholder="Ár"
              className="w-full mb-2 p-3 rounded-xl bg-gray-800"
            />

            <textarea
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              placeholder="Leírás"
              className="w-full mb-2 p-3 rounded-xl bg-gray-800"
            />

            <input
              type="file"
              onChange={(e) =>
                setEditImage(e.target.files ? e.target.files[0] : null)
              }
              className="mb-4"
            />

            <div className="flex justify-between">
              <button
                onClick={() => setEditingPost(null)}
                className="bg-gray-700 hover:bg-gray-600 px-5 py-2 rounded-xl"
              >
                Mégse
              </button>

              <button
                onClick={handleUpdate}
                className="bg-green-600 hover:bg-green-700 px-5 py-2 rounded-xl"
              >
                Mentés
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}