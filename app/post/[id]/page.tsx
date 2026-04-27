"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { db } from "../../lib/firebase";
import { doc, getDoc } from "firebase/firestore";

export default function PostDetail() {
  const params = useParams();
  const id = params.id as string;

  const [post, setPost] = useState<any>(null);
  const [activeImage, setActiveImage] = useState(0);

  useEffect(() => {
    const fetchPost = async () => {
      const ref = doc(db, "posts", id);
      const snap = await getDoc(ref);

      if (snap.exists()) {
        setPost({ id: snap.id, ...snap.data() });
      }
    };

    if (id) fetchPost();
  }, [id]);

  if (!post) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        Betöltés...
      </div>
    );
  }

  const images = post.imageUrls?.length
    ? post.imageUrls
    : post.imageUrl
    ? [post.imageUrl]
    : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black text-white">
      <div className="max-w-6xl mx-auto p-6">
        <Link
          href="/dashboard"
          className="inline-block mb-6 text-gray-300 hover:text-white"
        >
          ← Vissza a dashboardra
        </Link>

        <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden shadow-2xl backdrop-blur">
          {images.length > 0 && (
            <div>
              <img
                src={images[activeImage]}
                className="w-full h-[520px] object-cover"
              />

              <div className="flex gap-3 p-4 overflow-x-auto">
                {images.map((img: string, index: number) => (
                  <button
                    key={index}
                    onClick={() => setActiveImage(index)}
                    className={`rounded-xl overflow-hidden border ${
                      activeImage === index
                        ? "border-green-400"
                        : "border-white/10"
                    }`}
                  >
                    <img
                      src={img}
                      className="w-24 h-20 object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="p-8">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
              <div>
                <h1 className="text-4xl font-bold mb-2">
                  {post.title}
                </h1>

                <p className="text-gray-400 text-xl">
                  📍 {post.city}
                </p>
              </div>

              <div className="bg-green-500/10 border border-green-500/30 rounded-2xl px-6 py-4">
                <p className="text-green-400 text-3xl font-bold">
                  {Number(post.price).toLocaleString("hu-HU")} Ft
                </p>
              </div>
            </div>

            <div className="mt-8">
              <h2 className="text-2xl font-bold mb-3">
                Leírás
              </h2>

              <p className="text-gray-300 leading-8 text-lg">
                {post.description}
              </p>
            </div>

            <div className="mt-8 flex gap-3">
              <Link
                href="/dashboard"
                className="bg-gray-800 hover:bg-gray-700 px-5 py-3 rounded-xl"
              >
                Dashboard
              </Link>

              <Link
                href="/create"
                className="bg-green-600 hover:bg-green-700 px-5 py-3 rounded-xl"
              >
                Új ingatlan
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}