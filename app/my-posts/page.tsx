'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useRouter } from 'next/navigation';

type Post = {
  id: number;
  title: string;
  image: string | null;
  images: string[] | null;
  price: number | null;
  city: string | null;
  user_id: string | null;
};

export default function MyPostsPage() {
  const router = useRouter();

  const [posts, setPosts] = useState<Post[]>([]);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const load = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const currentUser = sessionData.session?.user;

      if (!currentUser) return;

      setUser(currentUser);

      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('id', { ascending: false });

      if (error) {
        console.error(error.message);
        return;
      }

      const normalized = (data || []).map((p: any) => ({
        ...p,
        images: Array.isArray(p.images)
          ? p.images
          : p.image
          ? [p.image]
          : [],
      }));

      setPosts(normalized);
    };

    load();
  }, []);

  const handleDelete = async (id: number) => {
    setPosts((prev) => prev.filter((p) => p.id !== id));
    await supabase.from('posts').delete().eq('id', id);
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">

      <button
        onClick={() => router.push('/')}
        className="mb-4 bg-gray-800 px-3 py-1 rounded hover:bg-gray-700 transition"
      >
        ← Vissza
      </button>

      <h1 className="text-3xl mb-6">📋 Saját hirdetések</h1>

      {posts.length === 0 && (
        <p className="text-gray-400">Nincs hirdetésed</p>
      )}

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {posts.map((p) => {
          const images = p.images || (p.image ? [p.image] : []);
          const img = images[0];

          return (
            <div
              key={p.id}
              onClick={() => router.push(`/post/${p.id}`)}
              className="bg-gray-900 rounded-xl overflow-hidden cursor-pointer hover:scale-105 transition"
            >
              {/* KÉP */}
              {img ? (
                <img
                  src={img}
                  className="w-full h-48 object-cover"
                />
              ) : (
                <div className="h-48 bg-gray-800 flex items-center justify-center">
                  Nincs kép
                </div>
              )}

              {/* TARTALOM */}
              <div className="p-4">
                <h2 className="text-lg font-semibold">{p.title}</h2>
                <p>{p.city}</p>
                <p>{p.price}</p>

                {/* GOMBOK */}
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/post/${p.id}`);
                    }}
                    className="flex-1 bg-yellow-600 py-2 rounded hover:bg-yellow-500 transition"
                  >
                    Megnyitás
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(p.id);
                    }}
                    className="flex-1 bg-red-600 py-2 rounded hover:bg-red-500 transition"
                  >
                    Törlés
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}