"use client";

import { useEffect, useState } from "react";
import { db } from "../../lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { useParams } from "next/navigation";

export default function PostDetail() {
  const params = useParams();
  const id = params.id as string;

  const [post, setPost] = useState<any>(null);

  useEffect(() => {
    const fetchPost = async () => {
      const ref = doc(db, "posts", id);
      const snap = await getDoc(ref);

      if (snap.exists()) {
        setPost(snap.data());
      }
    };

    if (id) fetchPost();
  }, [id]);

  if (!post) return <div className="text-white p-6">Betöltés...</div>;

  return (
    <div className="p-6 text-white">
      <img src={post.imageUrl} className="rounded-xl mb-4" />
      <h1 className="text-2xl font-bold">{post.title}</h1>
      <p>{post.city}</p>
      <p className="text-green-400">{post.price} Ft</p>
      <p>{post.description}</p>
    </div>
  );
}