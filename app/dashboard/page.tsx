"use client";

import { useEffect, useState } from "react";
import { auth, db, storage } from "../lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { useParams } from "next/navigation";
import Link from "next/link";

type Post = {
  id: string;
  title: string;
  city: string;
  price: number;
  description: string;
  imageUrl: string;
};

export default function PostDetail() {
  const params = useParams();
  const id = params.id as string;

  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const ref = doc(db, "posts", id);
        const snap = await getDoc(ref);

        if (snap.exists()) {
          setPost({ id: snap.id, ...(snap.data() as Omit<Post, "id">) });
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchPost();
  }, [id]);

  if (loading) {
    return <div className="text-white p-6">Betöltés...</div>;
  }

  if (!post) {
    return (
      <div className="text-white p-6">
        <p>Az ingatlan nem található.</p>
        <Link href="/dashboard" className="text-green-400">
          ← Vissza
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-6xl mx-auto p-6">
        <Link
          href="/dashboard"
          className="inline-block mb-6 text-gray-300 hover:text-white transition"
        >
          ← Vissza a dashboardra
        </Link>

        <div className="relative overflow-hidden rounded-3xl bg-gray-900 shadow-2xl">
          <img
            src={post.imageUrl}
            alt={post.title}
            className="w-full h-[520px] object-cover"
          />

          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

          <div className="absolute bottom-0 left-0 right-0 p-8">
            <h1 className="text-4xl md:text-5xl font-bold mb-2">
              {post.title}
            </h1>

            <p className="text-xl text-gray-200">📍 {post.city}</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mt-6">
          <div className="lg:col-span-2 bg-gray-900 rounded-2xl p-6 border border-gray-800">
            <h2 className="text-2xl font-bold mb-4">Leírás</h2>

            <p className="text-gray-300 leading-8 text-lg">
              {post.description}
            </p>
          </div>

          <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800 h-fit sticky top-24">
            <p className="text-gray-400 mb-2">Ár</p>

            <p className="text-green-400 text-3xl font-bold mb-6">
              {Number(post.price).toLocaleString("hu-HU")} Ft
            </p>

            <button className="w-full bg-green-600 hover:bg-green-700 transition rounded-xl py-3 font-semibold">
              Érdekel
            </button>

            <Link
              href="/dashboard"
              className="block text-center mt-3 bg-gray-800 hover:bg-gray-700 transition rounded-xl py-3"
            >
              Vissza
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}