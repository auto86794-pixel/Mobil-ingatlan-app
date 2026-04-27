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

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!user) return;
    fetchPosts(user.uid);
  }, [user]);

  const fetchPosts = async (uid: string) => {
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
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    await deleteDoc(doc(db, "posts", id));
    setPosts((prev) => prev.filter((p) => p.id !== id));
  };

  const handleUpdate = async () => {
    if (!editingPost) return;

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
        p.id === editingPost.id ? { ...editingPost, imageUrl } : p
      )
    );

    setEditingPost(null);
    setNewImage(null);
    setPreview(null);
  };

  if (loading) return <div className="text-white p-6">Betöltés...</div>;

  return (
    <div className="p-6 text-white">
      <h1 className="text-3xl mb-6 font-bold">Dashboard</h1>

      <div className="grid sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {posts.map((post) => (
          <div
            key={post.id}
            className="bg-gray-900 rounded-xl overflow-hidden shadow-lg hover:scale-[1.03] hover:shadow-2xl transition duration-300"
          >
            <img
              src={post.imageUrl}
              className="w-full h-48 object-cover"
            />

            <div className="p-4">
              <h2 className="font-bold">{post.title}</h2>
              <p className="text-gray-400 text-sm">{post.city}</p>

              <p className="text-green-400 font-bold">
                {post.price.toLocaleString()} Ft
              </p>

              {/* 🔥 GOMBOK */}
              <div className="flex gap-2 mt-3">

                {/* 🟢 ZÖLD MEGNÉZEM */}
                <a
                  href={`/post/${post.id}`}
                  className="bg-green-600 px-3 py-1 rounded-lg hover:bg-green-700 transition flex items-center gap-1"
                >
                  👁 Megnézem
                </a>

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
        <div className="fixed inset-0 bg-black/70 backdrop-blur flex justify-center items-center z-50">
          <div className="bg-gray-900 p-6 rounded-xl w-full max-w-md shadow-2xl">

            <h2 className="text-xl mb-4">Szerkesztés</h2>

            <input
              className="w-full p-2 mb-2 bg-gray-800"
              value={editingPost.title}
              onChange={(e) =>
                setEditingPost({ ...editingPost, title: e.target.value })
              }
            />

            <input
              className="w-full p-2 mb-2 bg-gray-800"
              value={editingPost.city}
              onChange={(e) =>
                setEditingPost({ ...editingPost, city: e.target.value })
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

            {/* 🔥 KÉP CSERE */}
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
                className="w-full h-40 object-cover mt-2 rounded"
              />
            )}

            <div className="flex gap-2 mt-3">
              <button
                onClick={handleUpdate}
                className="bg-green-600 px-4 py-2 rounded hover:bg-green-700"
              >
                Mentés
              </button>

              <button
                onClick={() => {
                  setEditingPost(null);
                  setPreview(null);
                  setNewImage(null);
                }}
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