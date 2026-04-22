'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/app/lib/supabase';
import { useParams } from 'next/navigation';

type Post = {
  id: number;
  title: string;
  content: string;
  image: string | null;
  images: string[] | null;
  price: number | null;
  city: string | null;
};

export default function PostPage() {
  const params = useParams();
  const id = params?.id as string;

  const [post, setPost] = useState<Post | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (!id) return;

    const loadPost = async () => {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Post load error:', error.message);
        return;
      }

      setPost(data);
    };

    loadPost();
  }, [id]);

  if (!post) {
    return <div className="text-white p-6">Betöltés...</div>;
  }

  const images = Array.isArray(post.images)
    ? post.images
    : post.image
    ? [post.image]
    : [];

  const activeImage = images[activeIndex] || '';

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      <h1 className="text-3xl font-bold mb-4">{post.title}</h1>

      {/* KÉP */}
      {activeImage ? (
        <img
          src={activeImage}
          className="w-full max-h-[400px] object-cover rounded mb-4 cursor-pointer"
          onClick={() => {
            if (images.length <= 1) return;
            setActiveIndex((prev) => (prev + 1) % images.length);
          }}
        />
      ) : (
        <div className="h-64 bg-gray-800 flex items-center justify-center">
          Nincs kép
        </div>
      )}

      {/* DOTS */}
      {images.length > 1 && (
        <div className="flex gap-2 justify-center mb-4">
          {images.map((_, i) => (
            <div
              key={i}
              className={`w-3 h-3 rounded-full ${
                i === activeIndex ? 'bg-blue-500' : 'bg-gray-500'
              }`}
            />
          ))}
        </div>
      )}

      {/* INFÓ */}
      <p className="text-blue-400">📍 {post.city || '—'}</p>

      <p className="text-green-400 text-2xl font-bold">
        {post.price ? `${post.price.toLocaleString()} Ft` : '—'}
      </p>

      <p className="mt-4 text-gray-300">{post.content}</p>
    </div>
  );
}