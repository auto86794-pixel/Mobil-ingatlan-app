'use client';

import { useEffect, useState } from 'react';
import { supabase } from './lib/supabase';

type Post = {
  id: number;
  title: string;
  city: string;
  price: number;
  description: string;
  image?: string | null;
};

export default function HomePage() {
  const [title, setTitle] = useState('');
  const [city, setCity] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);

  const [posts, setPosts] = useState<Post[]>([]);

  // 📥 LOAD POSTS
  useEffect(() => {
    const loadPosts = async () => {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error(error.message);
      } else {
        setPosts(data || []);
      }
    };

    loadPosts();
  }, []);

  // 📤 SUBMIT
  const handleSubmit = async () => {
    let imageUrl: string | null = null;

    if (file) {
      const fileName = `${Date.now()}-${file.name}`;

      const { error: uploadError } = await supabase.storage
        .from('images')
        .upload(fileName, file);

      if (!uploadError) {
        const { data } = supabase.storage
          .from('images')
          .getPublicUrl(fileName);

        imageUrl = data.publicUrl;
      }
    }

    const { error } = await supabase.from('posts').insert({
      title,
      city,
      price: Number(price),
      description,
      image: imageUrl,
    });

    if (!error) {
      setTitle('');
      setCity('');
      setPrice('');
      setDescription('');
      setFile(null);

      // 🔄 reload
      const { data } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false });

      setPosts(data || []);
    }
  };

  return (
    <div className="p-6 text-white bg-gray-950 min-h-screen">
      
      <h1 className="text-2xl mb-4">🏠 Lakások</h1>

      {/* FORM */}
      <div className="max-w-md space-y-2">
        <input
          placeholder="Cím"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full p-2 rounded bg-gray-800"
        />

        <input
          placeholder="Város"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          className="w-full p-2 rounded bg-gray-800"
        />

        <input
          placeholder="Ár"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          className="w-full p-2 rounded bg-gray-800"
        />

        <textarea
          placeholder="Leírás"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full p-2 rounded bg-gray-800"
        />

        <input
          type="file"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
        />

        <button
          onClick={handleSubmit}
          className="bg-green-600 w-full py-2 rounded"
        >
          Mentés
        </button>
      </div>

      {/* 📋 LISTA */}
      <div className="mt-10 space-y-4 max-w-md">
        {posts.map((post) => (
          <div key={post.id} className="bg-gray-800 p-4 rounded-xl">

            {post.image && (
              <img
                src={post.image}
                className="w-full h-48 object-cover rounded mb-2"
              />
            )}

            <h2 className="text-xl font-bold">{post.title}</h2>
            <p className="text-sm opacity-70">{post.city}</p>
            <p className="text-green-400 font-bold">
              {post.price} Ft
            </p>
            <p className="mt-2">{post.description}</p>

          </div>
        ))}
      </div>

    </div>
  );
}