"use client";

import { useEffect, useState } from "react";
import { db } from "../../lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import Link from "next/link";

export default function PostDetail({ params }: { params: { id: string } }) {
  const [post, setPost] = useState<any>(null);

  useEffect(() => {
    const fetchPost = async () => {
      const ref = doc(db, "posts", params.id);
      const snap = await getDoc(ref);

      if (snap.exists()) {
        setPost({ id: snap.id, ...snap.data() });
      }
    };

    fetchPost();
  }, [params.id]);

  if (!post) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        Betöltés...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-slate-950 to-gray-900 text-white">
      <div className="max-w-5xl mx-auto p-6">
        <Link href="/dashboard" className="text-blue-400">
          ← Vissza
        </Link>

        <div className="mt-6 bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
          {post.imageUrl && (
            <img
              src={post.imageUrl}
              alt={post.title}
              className="h-[500px] w-full object-cover"
            />
          )}

          <div className="p-8">
            <h1 className="text-4xl font-bold mb-2">{post.title}</h1>
            <p className="text-gray-400 text-xl mb-4">{post.city}</p>

            <p className="text-green-400 text-3xl font-bold mb-6">
              {Number(post.price).toLocaleString("hu-HU")} Ft
            </p>

            <p className="text-gray-300 leading-7">
              {post.description}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}