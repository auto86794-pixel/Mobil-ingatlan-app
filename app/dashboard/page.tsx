"use client";

import { useEffect, useState } from "react";
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
import toast from "react-hot-toast";

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

  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [newImage, setNewImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  // 🔥 USER
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (u) {
        setUser(u);
        fetchPosts(u.uid);
      } else {
        window.location.href = "/login";
      }
    });

    return () => unsub();
  }, []);

  // 🔥 FETCH
  const fetchPosts = async (uid: string) => {
    try {
      const q = query(
        collection(db, "posts"),
        where("userId", "==", uid)
      );

      const snap = await getDocs(q);

      const data: Post[] = [];
      snap.forEach((docSnap) => {
        data.push({ id: docSnap.id, ...(docSnap.data() as any) });
      });

      setPosts(data);
    } catch (err) {
      console.error(err);
      toast.error("Hiba betöltéskor ❌");
    } finally {
      setLoading(false);
    }
  };

  // 🗑️ DELETE
  const handleDelete = async (id: string) => {
    if (!confirm("Biztos törlöd?")) return;

    try {
      await deleteDoc(doc(db, "posts", id));
      setPosts((prev) => prev.filter((p) => p.id !== id));
      toast.success("Törölve ✅");
    } catch (err) {
      console.error(err);
      toast.error("Hiba törléskor ❌");
    }
  };

  // ✏️ UPDATE
  const handleUpdate = async () => {
    if (!editingPost) return;

    try {
      let imageUrl = editingPost.imageUrl;

      if (newImage) {
        const fileName = `${Date.now()}-${newImage.name}`;
        const imageRef = ref(storage, `images/${fileName}`);

        await uploadBytes(imageRef, newImage);
        imageUrl = await getDownloadURL(imageRef);
      }

      const refDoc = doc(db, "posts", editingPost.id);

      await updateDoc(refDoc, {
        title: editingPost.title,
        city: editingPost.city,
        price: editingPost.price,
        description: editingPost.description,
        imageUrl,
      });

      setPosts((prev) =>
        prev.map((p) =>
          p.id === editingPost.id
            ? { ...editingPost, imageUrl }
            : p
        )
      );

      setEditingPost(null);
      setNewImage(null);
      setPreview(null);

      toast.success("Frissítve ✨");
    } catch (err) {
      console.error(err);
      toast.error("Hiba frissítéskor ❌");
    }
  };

  if (loading) {
    return <div className="p-6 text-white">Betöltés...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      <h1 className="text-3xl font-bold mb-6">📊 Dashboard</h1>

      {user && (
        <p className="mb-6 text-gray-400">
          Bejelentkezve: {user.email}
        </p>
      )}

      {posts.length === 0 && (
        <p className="text-gray-500">
          Nincs még ingatlanod 😢
        </p>
      )}

      {/* GRID */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {posts.map((post) => (
          <div
            key={post.id}
            className="bg-gray-900 rounded-xl overflow-hidden shadow-lg hover:scale-[1.02] transition"
          >
            <img
              src={post.imageUrl}
              className="h-48 w-full object-cover"
            />

            <div className="p-4">
              <h2 className="text-xl font-bold">
                {post.title}
              </h2>

              <p className="text-gray-400">{post.city}</p>

              <p className="text-green-400">
                {post.price.toLocaleString()} Ft
              </p>

              {/* GOMBOK */}
              <div className="flex gap-2 mt-3">

                <a
                  href={`/post/${post.id}`}
                  className="bg-green-600 px-3 py-1 rounded hover:bg-green-700"
                >
                  👁 Megnézem
                </a>

                <button
                  onClick={() => setEditingPost(post)}
                  className="bg-blue-600 px-3 py-1 rounded"
                >
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

      {/* 🔥 MODAL */}
      {editingPost && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-gray-900 p-6 rounded-xl w-full max-w-md">

            <h2 className="text-xl mb-4">Szerkesztés</h2>

            <input
              className="w-full p-2 mb-2 bg-gray-800"
              value={editingPost.title}
              onChange={(e) =>
                setEditingPost({
                  ...editingPost,
                  title: e.target.value,
                })
              }
            />

            <input
              className="w-full p-2 mb-2 bg-gray-800"
              value={editingPost.city}
              onChange={(e) =>
                setEditingPost({
                  ...editingPost,
                  city: e.target.value,
                })
              }
            />

            <input
              type="number"
              className="w-full p-2 mb-2 bg-gray-800"
              value={editingPost.price}
              onChange={(e) =>
                setEditingPost({
                  ...editingPost,
                  price: Number(e.target.value),
                })
              }
            />

            <textarea
              className="w-full p-2 mb-2 bg-gray-800"
              value={editingPost.description}
              onChange={(e) =>
                setEditingPost({
                  ...editingPost,
                  description: e.target.value,
                })
              }
            />

            {/* IMAGE */}
            <input
              type="file"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  setNewImage(file);
                  setPreview(URL.createObjectURL(file));
                }
              }}
            />

            {preview && (
              <img
                src={preview}
                className="w-full h-40 object-cover mt-2"
              />
            )}

            <div className="flex gap-2 mt-3">
              <button
                onClick={handleUpdate}
                className="bg-green-600 px-4 py-2 rounded"
              >
                Mentés
              </button>

              <button
                onClick={() => setEditingPost(null)}
                className="bg-gray-600 px-4 py-2 rounded"
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