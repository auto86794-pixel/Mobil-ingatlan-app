'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

type Post = {
  id: number;
  title: string;
  content: string;
  image: string | null;
  images: string[] | null;
  price: number | null;
  city: string | null;
  user_id: string | null;
};

export default function PostPage() {
  const params = useParams();
  const router = useRouter();

  const postId = params.id as string;

  const [post, setPost] = useState<Post | null>(null);
  const [user, setUser] = useState<any>(null);

  // 🔐 USER
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user || null);
    });
  }, []);

  // 📥 POST BETÖLTÉS
  useEffect(() => {
    const loadPost = async () => {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('id', Number(postId))
        .single();

      if (error) {
        console.error(error.message);
        return;
      }

      setPost({
        ...data,
        images: Array.isArray(data.images)
          ? data.images
          : data.image
          ? [data.image]
          : [],
      });
    };

    loadPost();
  }, [postId]);

  if (!post) {
    return <div className="p-6 text-white">Betöltés...</div>;
  }

  const images = post.images || [];

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">

      <button
        onClick={() => router.back()}
        className="mb-4 bg-gray-800 px-3 py-1 rounded"
      >
        ← Vissza
      </button>

      {/* 🖼️ KÉPEK */}
      <div className="grid md:grid-cols-2 gap-4 mb-6">
        {images.length > 0 ? (
          images.map((img, i) => (
            <img
              key={i}
              src={img}
              className="w-full h-64 object-cover rounded"
            />
          ))
        ) : (
          <div className="h-64 bg-gray-800 flex items-center justify-center">
            Nincs kép
          </div>
        )}
      </div>

      {/* 📄 ADATOK */}
      <h1 className="text-3xl mb-2">{post.title}</h1>
      <p className="text-gray-400 mb-2">{post.city}</p>
      <p className="text-xl mb-4">{post.price} Ft</p>

      <p className="mb-6">{post.content}</p>

      {/* 💬 CHAT GOMB */}
      {user && post.user_id && user.id !== post.user_id && (
        <button
          onClick={() =>
            router.push(`/post/${post.id}/inbox/chat/${post.user_id}`)
          }
          className="bg-blue-600 px-6 py-3 rounded-xl"
        >
          💬 Írj az eladónak
        </button>
      )}

      {/* ⚠️ SAJÁT POST */}
      {user && user.id === post.user_id && (
        <p className="text-gray-400">Ez a saját hirdetésed</p>
      )}

    </div>
  );
}