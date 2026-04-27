"use client";

import { useEffect, useState } from "react";
import { db } from "../../lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { useParams } from "next/navigation";
import Link from "next/link";

export default function PostDetail() {
  const params = useParams();
  const id = params?.id as string;

  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);

  // 🔥 FETCH
  useEffect(() => {
    if (!id) return;

    const fetchPost = async () => {
      try {
        const ref = doc(db, "posts", id);
        const snap = await getDoc(ref);

        if (snap.exists()) {
          setPost({ id: snap.id, ...snap.data() });
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [id]);

  // ⏳ LOADING
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950 text-white">
        Betöltés...
      </div>
    );
  }

  // ❌ NOT FOUND
  if (!post) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950 text-white">
        Nem található 😢
      </div>
    );
  }

  // 🔥 IMAGE LIST (fallback)
  const images =
    post.imageUrls?.length > 0
      ? post.imageUrls
      : post.imageUrl
      ? [post.imageUrl]
      : [];

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      <div className="max-w-5xl mx-auto">

        {/* 🔙 BACK */}
        <Link
          href="/"
          className="text-gray-400 hover:text-white mb-4 inline-block"
        >
          ← Vissza
        </Link>

        {/* 🔥 SLIDER */}
        {images.length > 0 && (
          <>
            <div className="relative">

              <img
                src={images[activeImage]}
                className="w-full h-[520px] object-cover rounded-2xl"
              />

              {/* ← */}
              {activeImage > 0 && (
                <button
                  onClick={() => setActiveImage(activeImage - 1)}
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/60 px-3 py-2 rounded-full"
                >
                  ⬅
                </button>
              )}

              {/* → */}
              {activeImage < images.length - 1 && (
                <button
                  onClick={() => setActiveImage(activeImage + 1)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/60 px-3 py-2 rounded-full"
                >
                  ➡
                </button>
              )}
            </div>

            {/* 🔥 THUMBNAIL */}
            <div className="flex gap-2 mt-3 overflow-x-auto">
              {images.map((img: string, i: number) => (
                <img
                  key={i}
                  src={img}
                  onClick={() => setActiveImage(i)}
                  className={`w-20 h-16 object-cover rounded cursor-pointer ${
                    activeImage === i
                      ? "border-2 border-green-400"
                      : ""
                  }`}
                />
              ))}
            </div>
          </>
        )}

        {/* 📦 CONTENT */}
        <div className="mt-6 bg-gray-900 p-6 rounded-xl">

          <h1 className="text-3xl font-bold mb-2">
            {post.title}
          </h1>

          <p className="text-gray-400 mb-2">
            📍 {post.city}
          </p>

          <p className="text-green-400 text-2xl font-bold mb-4">
            {post.price?.toLocaleString()} Ft
          </p>

          <p className="text-gray-300 leading-7">
            {post.description}
          </p>

        </div>
      </div>
    </div>
  );
}