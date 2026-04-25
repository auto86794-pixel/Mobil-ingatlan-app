'use client';

import { useEffect, useState } from 'react';
import { db } from '../lib/firebase';
import {
  collection,
  getDocs,
  deleteDoc,
  doc,
} from 'firebase/firestore';

type Post = {
  id?: string;
  title: string;
  city: string;
  price: number;
  description: string;
  image?: string;
};

export default function PostsPage() {
  const [posts, setPosts] = useState<Post[]>([]);

  const loadPosts = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'posts'));

      const data: Post[] = snapshot.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Post),
      }));

      console.log('POSTS:', data); // 🔥 DEBUG

      setPosts(data);
    } catch (err) {
      console.error('LOAD ERROR:', err);
    }
  };

  useEffect(() => {
    loadPosts();
  }, []);

  const handleDelete = async (id?: string) => {
    if (!id) return;

    if (!confirm('Biztos törlöd?')) return;

    await deleteDoc(doc(db, 'posts', id));
    loadPosts();
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 flex justify-center">
      <div className="w-full max-w-md space-y-4">

        <h1 className="text-3xl font-bold text-center mb-6">
          📋 Lakások listája
        </h1>

        {/* HA ÜRES */}
        {posts.length === 0 && (
          <p className="text-center text-gray-400">
            Nincs még adat 😢
          </p>
        )}

        {/* LISTA */}
        {posts.map((post) => (
          <div
            key={post.id}
            className="bg-gray-900 p-4 rounded-xl shadow border border-gray-800"
          >

            {post.image && (
              <img
                src={post.image}
                className="w-full h-40 object-cover rounded mb-2"
                alt={post.title}
              />
            )}

            <h2 className="text-lg font-bold">{post.title}</h2>

            <p className="text-sm text-gray-400">{post.city}</p>

            <p className="text-green-400 font-bold text-lg">
              {post.price} Ft
            </p>

            <p className="mt-2 text-sm">{post.description}</p>

            <button
              onClick={() => handleDelete(post.id)}
              className="mt-3 w-full bg-red-600 hover:bg-red-700 py-2 rounded"
            >
              Törlés
            </button>

          </div>
        ))}

      </div>
    </div>
  );
}