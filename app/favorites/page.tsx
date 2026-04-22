'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useRouter } from 'next/navigation';

type Post = {
  id: number;
  title: string;
  content: string;
  image: string | null;
  images: string[] | null;
  price: number | null;
  city: string | null;
};

export default function FavoritesPage() {
  const router = useRouter();

  const [posts, setPosts] = useState<Post[]>([]);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // 🔐 USER BETÖLTÉS
  useEffect(() => {
    const loadUser = async () => {
      const { data } = await supabase.auth.getSession();
      setUser(data.session?.user || null);
    };

    loadUser();
  }, []);

  // 📥 FAVORITES + POSTS BETÖLTÉS
  useEffect(() => {
    const loadFavorites = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      setLoading(true);

      // kedvencek lekérés
      const { data: favData, error: favError } = await supabase
        .from('favorites')
        .select('post_id')
        .eq('user_id', user.id);

      if (favError) {
        console.error(favError.message);
        setLoading(false);
        return;
      }

      const ids = favData?.map((f) => f.post_id) || [];

      if (ids.length === 0) {
        setPosts([]);
        setLoading(false);
        return;
      }

      // postok lekérése
      const { data: postsData, error: postError } = await supabase
        .from('posts')
        .select('*')
        .in('id', ids);

      if (postError) {
        console.error(postError.message);
        setLoading(false);
        return;
      }

      const normalized = (postsData || []).map((p: any) => ({
        ...p,
        images: Array.isArray(p.images)
          ? p.images
          : p.image
          ? [p.image]
          : [],
      }));

      setPosts(normalized);
      setLoading(false);
    };

    loadFavorites();
  }, [user]);

  // ❤️ KEDVENC TÖRLÉS
  const removeFavorite = async (postId: number) => {
    if (!user) return;

    const { error } = await supabase
      .from('favorites')
      .delete()
      .eq('post_id', postId)
      .eq('user_id', user.id);

    if (error) {
      console.error(error.message);
      return;
    }

    // azonnali UI frissítés
    setPosts((prev) => prev.filter((p) => p.id !== postId));
  };

  // 🧠 SEGÉDEK
  const formatPrice = (price: number | null) =>
    price ? `${price.toLocaleString()} Ft` : 'Nincs megadva';

  const formatCity = (city: string | null) =>
    city?.trim() ? city : 'Ismeretlen hely';

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">

      <h1 className="text-3xl text-center mb-6">❤️ Kedvenceim</h1>

      {/* ⏳ LOADING */}
      {loading && (
        <p className="text-center text-gray-400">Betöltés...</p>
      )}

      {/* ❌ EMPTY */}
      {!loading && posts.length === 0 && (
        <p className="text-center text-gray-400">
          Nincsenek kedvenceid még
        </p>
      )}

      {/* 📦 KÁRTYÁK */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {posts.map((p) => {
          const image =
            Array.isArray(p.images) && p.images.length > 0
              ? p.images[0]
              : p.image;

          return (
            <div
              key={p.id}
              onClick={() => router.push(`/post/${p.id}`)}
              className="relative bg-gray-900 rounded-xl overflow-hidden cursor-pointer hover:scale-[1.02] transition"
            >
              {/* ❤️ REMOVE */}
              <div className="absolute top-3 right-3 z-10">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFavorite(p.id);
                  }}
                  className="text-2xl"
                >
                  ❤️
                </button>
              </div>

              {image ? (
                <img
                  src={image}
                  className="w-full h-48 object-cover"
                />
              ) : (
                <div className="h-48 bg-gray-800 flex items-center justify-center text-gray-400">
                  Nincs kép
                </div>
              )}

              <div className="p-4">
                <h2 className="text-xl font-semibold">
                  {p.title || 'Nincs cím'}
                </h2>

                <p className="text-blue-400">
                  📍 {formatCity(p.city)}
                </p>

                <p className="text-green-400 font-bold">
                  {formatPrice(p.price)}
                </p>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}