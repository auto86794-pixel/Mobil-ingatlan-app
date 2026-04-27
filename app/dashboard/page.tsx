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
import {
  ref,
  uploadBytes,
  getDownloadURL,
} from "firebase/storage";

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [editing, setEditing] = useState<any>(null);

  const [title, setTitle] = useState("");
  const [city, setCity] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState<File | null>(null);

  // 🔥 LOAD
  useEffect(() => {
    onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (u) fetchPosts(u.uid);
    });
  }, []);

  const fetchPosts = async (uid: string) => {
    const q = query(collection(db, "posts"), where("userId", "==", uid));
    const snap = await getDocs(q);

    const data: any[] = [];
    snap.forEach((docSnap) => {
      data.push({ id: docSnap.id, ...docSnap.data() });
    });

    setPosts(data);
  };

  // 🗑 DELETE
  const handleDelete = async (id: string) => {
    await deleteDoc(doc(db, "posts", id));
    setPosts(posts.filter((p) => p.id !== id));
  };

  // ✏️ OPEN EDIT
  const openEdit = (post: any) => {
    setEditing(post);
    setTitle(post.title);
    setCity(post.city);
    setPrice(post.price);
    setDescription(post.description);
  };

  // 💾 SAVE EDIT
  const handleUpdate = async () => {
    let imageUrl = editing.imageUrl;

    if (image) {
      const safeName = `${Date.now()}.jpg`;
      const imageRef = ref(storage, `images/${safeName}`);
      await uploadBytes(imageRef, image);
      imageUrl = await getDownloadURL(imageRef);
    }

    await updateDoc(doc(db, "posts", editing.id), {
      title,
      city,
      price: Number(price),
      description,
      imageUrl,
    });

    setEditing(null);
    setImage(null);
    fetchPosts(user.uid);
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      <h1 className="text-3xl mb-6">📊 Dashboard</h1>

      {/* LIST */}
      <div className="grid gap-6">
        {posts.map((post) => (
          <div key={post.id} className="bg-gray-800 rounded-xl p-4">
            <img src={post.imageUrl} className="rounded mb-2" />

            <h2 className="text-xl font-bold">{post.title}</h2>
            <p>{post.city}</p>
            <p className="text-green-400">{post.price} Ft</p>
            <p>{post.description}</p>

            <div className="flex gap-2 mt-3">
              <button
                onClick={() => openEdit(post)}
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
        ))}
      </div>

      {/* 🔥 MODAL */}
      {editing && (
        <div className="fixed inset-0 bg-black/70 flex justify-center items-center">
          <div className="bg-gray-900 p-6 rounded-xl w-full max-w-md">

            <h2 className="text-xl mb-4">✏️ Szerkesztés</h2>

            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full mb-2 p-2 bg-gray-800"
            />

            <input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full mb-2 p-2 bg-gray-800"
            />

            <input
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full mb-2 p-2 bg-gray-800"
            />

            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full mb-2 p-2 bg-gray-800"
            />

            <input
              type="file"
              onChange={(e) =>
                setImage(e.target.files ? e.target.files[0] : null)
              }
              className="mb-3"
            />

            <div className="flex gap-2">
              <button
                onClick={handleUpdate}
                className="bg-green-600 px-4 py-2 rounded"
              >
                Mentés
              </button>

              <button
                onClick={() => setEditing(null)}
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