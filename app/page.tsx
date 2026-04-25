'use client';

import { useEffect, useState } from 'react';
import { db } from './lib/firebase';
import {
  collection,
  addDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
} from 'firebase/firestore';

type Post = {
  id?: string;
  title: string;
  city: string;
  price: number;
  description: string;
  image?: string;
};

const uploadToCloudinary = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', 'albi_upload');

  const res = await fetch(
    'https://api.cloudinary.com/v1_1/drvdyql4b/image/upload',
    {
      method: 'POST',
      body: formData,
    }
  );

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error?.message || 'Upload hiba');
  }

  return data.secure_url;
};

export default function HomePage() {
  const [title, setTitle] = useState('');
  const [city, setCity] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);

  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingPosts, setLoadingPosts] = useState(true);

  // 🔍 FILTER STATE
  const [searchCity, setSearchCity] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

  const loadPosts = async () => {
    try {
      setLoadingPosts(true);

      const q = query(
        collection(db, 'posts'),
        orderBy('created_at', 'desc')
      );

      const snapshot = await getDocs(q);

      const data: Post[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Post),
      }));

      setPosts(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingPosts(false);
    }
  };

  useEffect(() => {
    loadPosts();
  }, []);

  const handleSubmit = async () => {
    try {
      setLoading(true);

      let imageUrl = '';

      if (file) {
        imageUrl = await uploadToCloudinary(file);
      }

      await addDoc(collection(db, 'posts'), {
        title,
        city,
        price: Number(price) || 0,
        description,
        image: imageUrl,
        created_at: serverTimestamp(),
      });

      setTitle('');
      setCity('');
      setPrice('');
      setDescription('');
      setFile(null);

      await loadPosts();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 🔍 FILTER LOGIC
  const filteredPosts = posts.filter((post) => {
    const matchCity = post.city
      .toLowerCase()
      .includes(searchCity.toLowerCase());

    const matchPrice =
      !maxPrice || post.price <= Number(maxPrice);

    return matchCity && matchPrice;
  });

  return (
    <div className="min-h-screen bg-gray-950 text-white">

      {/* NAVBAR */}
      <div className="bg-gray-900 border-b border-gray-800 p-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">🏠 Ingatlanok</h1>
        <span className="text-sm text-gray-400">
          Mini app 🚀
        </span>
      </div>

      <div className="max-w-6xl mx-auto p-6">

        {/* FILTER BAR */}
        <div className="bg-gray-900 p-4 rounded-xl mb-6 flex gap-3 flex-wrap">

          <input
            placeholder="Keresés város szerint..."
            value={searchCity}
            onChange={(e) => setSearchCity(e.target.value)}
            className="p-2 rounded bg-gray-800 border border-gray-700"
          />

          <input
            type="number"
            placeholder="Max ár"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            className="p-2 rounded bg-gray-800 border border-gray-700"
          />
        </div>

        {/* FORM */}
        <div className="bg-gray-900 p-6 rounded-xl mb-10 space-y-3">

          <input
            placeholder="Cím"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full p-3 rounded bg-gray-800"
          />

          <input
            placeholder="Város"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="w-full p-3 rounded bg-gray-800"
          />

          <input
            type="number"
            placeholder="Ár"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="w-full p-3 rounded bg-gray-800"
          />

          <textarea
            placeholder="Leírás"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full p-3 rounded bg-gray-800"
          />

          <input
            type="file"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-green-600 py-3 rounded"
          >
            {loading ? 'Mentés...' : 'Mentés'}
          </button>
        </div>

        {/* LIST */}
        <div className="grid gap-6 md:grid-cols-3">

          {loadingPosts ? (
            <p>Betöltés...</p>
          ) : filteredPosts.length === 0 ? (
            <p>Nincs találat.</p>
          ) : (
            filteredPosts.map((post) => (
              <div
                key={post.id}
                className="bg-gray-900 rounded-xl overflow-hidden shadow hover:scale-[1.02] transition"
              >
                {post.image && (
                  <img
                    src={post.image}
                    className="w-full h-40 object-cover"
                  />
                )}

                <div className="p-4">
                  <h2 className="font-bold text-lg">
                    {post.title}
                  </h2>

                  <p className="text-gray-400 text-sm">
                    {post.city}
                  </p>

                  <p className="text-green-400 font-bold mt-1">
                    {post.price.toLocaleString()} Ft
                  </p>

                  <p className="text-sm mt-2 text-gray-300">
                    {post.description}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}