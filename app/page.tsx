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

  useEffect(() => {
    const loadUser = async () => {
      const { data } = await supabase.auth.getSession();
      setUser(data.session?.user || null);
    };

    loadUser();

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => {
      data.subscription.unsubscribe();
    };
  }, []);

  const fetchPosts = async () => {
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .order('id', { ascending: false });

    if (error) {
      console.error('Postok betöltési hiba:', error.message);
      return;
    }

    const normalized = (data || []).map((p: any) => ({
      ...p,
      images: Array.isArray(p.images) ? p.images : p.image ? [p.image] : [],
    }));

    setPosts(normalized);
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchFavorites = async () => {
    if (!user) {
      setFavorites([]);
      return;
    }

    const { data, error } = await supabase
      .from('favorites')
      .select('post_id')
      .eq('user_id', user.id);

    if (error) {
      console.error('Kedvencek betöltési hiba:', error.message);
      return;
    }

    setFavorites(data?.map((f) => f.post_id) || []);
  };

  useEffect(() => {
    fetchFavorites();
  }, [user]);

  const toggleFavorite = async (postId: number) => {
    if (!user) {
      alert('Jelentkezz be!');
      return;
    }

    const isFav = favorites.includes(postId);

    if (isFav) {
      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Kedvenc törlési hiba:', error.message);
        return;
      }

      setFavorites((prev) => prev.filter((id) => id !== postId));
    } else {
      const { error } = await supabase.from('favorites').insert({
        post_id: postId,
        user_id: user.id,
      });

      if (error) {
        console.error('Kedvenc mentési hiba:', error.message);
        return;
      }

      setFavorites((prev) => [...prev, postId]);
    }
  };

  const handleFiles = (fileList: FileList | null) => {
    if (!fileList) return;

    const valid = Array.from(fileList);
    setFiles(valid);
    setPreview(valid.map((f) => URL.createObjectURL(f)));
  };

  useEffect(() => {
    return () => {
      preview.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [preview]);

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

      if (error) {
        console.error('Képfeltöltési hiba:', error.message);
        continue;
      }

      const { data } = supabase.storage.from('images').getPublicUrl(fileName);
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

  const handleCreate = async () => {
    if (!user) {
      alert('Login szükséges');
      return;
    }

    const images = await uploadImages();

    const { error } = await supabase.from('posts').insert([
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

    if (error) {
      console.error('Hirdetés létrehozási hiba:', error.message);
      return;
    }

    resetForm();
    fetchPosts();
  };

  const handleUpdate = async () => {
    if (!editingId) return;

    const newImages = files.length ? await uploadImages() : [];

    const updatedImages =
      newImages.length > 0 ? [...currentImages, ...newImages] : currentImages;

    const { error } = await supabase
      .from('posts')
      .update({
        title,
        content,
        price: price ? Number(price) : null,
        city,
        images: updatedImages,
        image: updatedImages[0] || null,
      })
      .eq('id', editingId);

    if (error) {
      console.error('Hirdetés frissítési hiba:', error.message);
      return;
    }

    resetForm();
    fetchPosts();
  };

  const handleDelete = async (id: number) => {
    setPosts((prev) => prev.filter((p) => p.id !== id));

    const { error } = await supabase.from('posts').delete().eq('id', id);

    if (error) {
      console.error('Törlési hiba:', error.message);
      fetchPosts();
    }
  };

  const startEdit = (post: Post) => {
    setEditingId(post.id);
    setTitle(post.title || '');
    setContent(post.content || '');
    setPrice(post.price ? String(post.price) : '');
    setCity(post.city || '');
    setCurrentImages(post.images || (post.image ? [post.image] : []));
    setFiles([]);
    setPreview([]);
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
              className="relative bg-gray-900 rounded-xl overflow-hidden cursor-pointer hover:scale-105 transition"
            >
              <div className="absolute top-3 right-3 z-10">
                <button
                  type="button"
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
                  alt={p.title || 'Lakás kép'}
                  className="w-full h-48 object-cover"
                />
              ) : (
                <div className="h-48 bg-gray-800 flex items-center justify-center">
                  Nincs kép
                </div>
              )}

              <div className="p-4">
                <h2 className="text-xl font-semibold">{p.title}</h2>
                <p>{p.city}</p>
                <p>{p.price}</p>

                {images.length > 1 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveImages((prev) => ({
                        ...prev,
                        [p.id]: (activeIndex + 1) % images.length,
                      }));
                    }}
                    className="mt-2 text-sm bg-gray-800 px-3 py-1 rounded"
                  >
                    Következő kép
                  </button>
                )}

                {p.user_id === user?.id && (
                  <div className="flex gap-2 mt-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        startEdit(p);
                      }}
                      className="bg-yellow-600 px-3 py-1 rounded"
                    >
                      Szerkeszt
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(p.id);
                      }}
                      className="bg-red-600 px-3 py-1 rounded"
                    >
                      Törlés
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="max-w-md mx-auto flex flex-col gap-3">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Cím"
          className="p-2 rounded bg-gray-900 border border-gray-700"
        />

        <input
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder="Város"
          className="p-2 rounded bg-gray-900 border border-gray-700"
        />

        <input
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder="Ár"
          className="p-2 rounded bg-gray-900 border border-gray-700"
        />

        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Leírás"
          className="p-2 rounded bg-gray-900 border border-gray-700 min-h-[120px]"
        />

        <input
          type="file"
          multiple
          onChange={(e) => handleFiles(e.target.files)}
          className="p-2 rounded bg-gray-900 border border-gray-700"
        />

        {preview.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            {preview.map((src, index) => (
              <img
                key={index}
                src={src}
                alt={`Preview ${index + 1}`}
                className="w-full h-24 object-cover rounded"
              />
            ))}
          </div>
        )}

        {currentImages.length > 0 && editingId && (
          <div>
            <p className="mb-2 text-sm text-gray-300">Jelenlegi képek:</p>
            <div className="grid grid-cols-3 gap-2">
              {currentImages.map((src, index) => (
                <img
                  key={index}
                  src={src}
                  alt={`Current ${index + 1}`}
                  className="w-full h-24 object-cover rounded"
                />
              ))}
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={editingId ? handleUpdate : handleCreate}
          className="bg-green-600 px-4 py-2 rounded"
        >
          {editingId ? 'Frissítés' : 'Mentés'}
        </button>
      </div>
    </div>
  );
}