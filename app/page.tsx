'use client';

import { useEffect, useState } from 'react';
import { supabase } from './lib/supabase';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

type Post = {
  id: number;
  title: string;
  content: string;
  image: string | null;
  images: string[] | null;
  price: number | null;
  city: string | null;
  user_id: string | null;
  email: string | null;
};

export default function Home() {
  const router = useRouter();

  const [posts, setPosts] = useState<Post[]>([]);
  const [favorites, setFavorites] = useState<number[]>([]);
  const [user, setUser] = useState<any>(null);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [price, setPrice] = useState('');
  const [city, setCity] = useState('');

  const [files, setFiles] = useState<File[]>([]);
  const [preview, setPreview] = useState<string[]>([]);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [currentImages, setCurrentImages] = useState<string[]>([]);
  const [activeImages, setActiveImages] = useState<Record<number, number>>({});

  // 🔐 USER
  useEffect(() => {
    const loadUser = async () => {
      const { data } = await supabase.auth.getSession();
      setUser(data.session?.user || null);
    };

    loadUser();

    const { data } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user || null);
    });

    return () => data.subscription.unsubscribe();
  }, []);

  // 📥 POSTS
  const fetchPosts = async () => {
    const { data } = await supabase
      .from('posts')
      .select('*')
      .order('id', { ascending: false });

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

  useEffect(() => {
    fetchPosts();
  }, []);

  // ❤️ FAVORITES LOAD
  const fetchFavorites = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('favorites')
      .select('post_id')
      .eq('user_id', user.id);

    setFavorites(data?.map((f) => f.post_id) || []);
  };

  useEffect(() => {
    fetchFavorites();
  }, [user]);

  // ❤️ TOGGLE
  const toggleFavorite = async (postId: number) => {
    if (!user) return alert('Jelentkezz be!');

    const isFav = favorites.includes(postId);

    if (isFav) {
      await supabase
        .from('favorites')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', user.id);

      setFavorites((prev) => prev.filter((id) => id !== postId));
    } else {
      await supabase.from('favorites').insert({
        post_id: postId,
        user_id: user.id,
      });

      setFavorites((prev) => [...prev, postId]);
    }
  };

  // 🖼️ FILE
  const handleFiles = (files: FileList | null) => {
    if (!files) return;

    const valid: File[] = [];

    Array.from(files).forEach((file) => {
      valid.push(file);
    });

    setFiles(valid);
    setPreview(valid.map((f) => URL.createObjectURL(f)));
  };

  useEffect(() => {
    return () => {
      preview.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [preview]);

  // ☁️ UPLOAD
  const uploadImages = async (): Promise<string[]> => {
    if (!files.length) return [];

    const urls: string[] = [];

    for (const file of files) {
      const cleanName = file.name
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9.-]/g, '-');

      const fileName = `${crypto.randomUUID()}-${cleanName}`;

      const { error } = await supabase.storage
        .from('images')
        .upload(fileName, file);

      if (error) continue;

      const { data } = supabase.storage
        .from('images')
        .getPublicUrl(fileName);

      urls.push(data.publicUrl);
    }

    return urls;
  };

  const resetForm = () => {
    setEditingId(null);
    setTitle('');
    setContent('');
    setPrice('');
    setCity('');
    setFiles([]);
    setPreview([]);
    setCurrentImages([]);
  };

  // ➕ CREATE
  const handleCreate = async () => {
    if (!user) return alert('Login szükséges');

    const images = await uploadImages();

    await supabase.from('posts').insert([
      {
        title,
        content,
        price: price ? Number(price) : null,
        city,
        image: images[0] || null,
        images,
        user_id: user.id,
        email: user.email,
      },
    ]);

    resetForm();
    fetchPosts();
  };

  // ✏️ UPDATE
  const handleUpdate = async () => {
    if (!editingId) return;

    const newImages = files.length ? await uploadImages() : [];

    await supabase
      .from('posts')
      .update({
        title,
        content,
        price: price ? Number(price) : null,
        city,
        images: [...currentImages, ...newImages],
      })
      .eq('id', editingId);

    resetForm();
    fetchPosts();
  };

  // 🗑️ DELETE
  const handleDelete = async (id: number) => {
    setPosts((prev) => prev.filter((p) => p.id !== id));
    await supabase.from('posts').delete().eq('id', id);
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">

      <div className="flex justify-between mb-6">
        <div className="flex gap-3">
          <Link href="/login" className="bg-blue-600 px-3 py-2 rounded">
            Login
          </Link>

          <Link href="/my-posts" className="bg-purple-600 px-3 py-2 rounded">
            Saját hirdetések
          </Link>
        </div>

        {user && <span className="text-green-400">{user.email}</span>}
      </div>

      <h1 className="text-3xl text-center mb-6">🏠 Lakások</h1>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
        {posts.map((p) => {
          const images = p.images || (p.image ? [p.image] : []);
          const activeIndex = activeImages[p.id] || 0;
          const activeSrc = images[activeIndex];

          return (
            <div
              key={p.id}
              onClick={() => router.push(`/post/${p.id}`)}
              className="relative bg-gray-900 rounded-xl overflow-hidden cursor-pointer"
            >
              {/* ❤️ */}
              <div className="absolute top-3 right-3 z-10">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavorite(p.id);
                  }}
                  className="text-2xl"
                >
                  {favorites.includes(p.id) ? '❤️' : '🤍'}
                </button>
              </div>

              {activeSrc ? (
                <img
                  src={activeSrc}
                  className="w-full h-48 object-cover"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (images.length <= 1) return;

                    setActiveImages((prev) => ({
                      ...prev,
                      [p.id]: (activeIndex + 1) % images.length,
                    }));
                  }}
                />
              ) : (
                <div className="h-48 bg-gray-800 flex items-center justify-center">
                  Nincs kép
                </div>
              )}

              <div className="p-4">
                <h2>{p.title}</h2>
                <p>{p.city}</p>
                <p>{p.price}</p>

                {p.user_id === user?.id && (
                  <div className="flex gap-2 mt-2">
                    <button onClick={(e) => { e.stopPropagation(); setEditingId(p.id); }}>
                      Szerkeszt
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); handleDelete(p.id); }}>
                      Törlés
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* FORM */}
      <div className="max-w-md mx-auto">
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Cím" />
        <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Város" />
        <input value={price} onChange={(e) => setPrice(e.target.value)} placeholder="Ár" />
        <textarea value={content} onChange={(e) => setContent(e.target.value)} />

        <input type="file" multiple onChange={(e) => handleFiles(e.target.files)} />

        <button onClick={editingId ? handleUpdate : handleCreate}>
          Mentés
        </button>
      </div>
    </div>
  );
}