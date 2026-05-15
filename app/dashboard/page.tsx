"use client";

import { useEffect, useState } from "react";

import {
  auth,
  db,
  storage,
} from "../lib/firebase";

import { onAuthStateChanged } from "firebase/auth";

import {
  collection,
  query,
  where,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
} from "firebase/firestore";

import {
  ref,
  uploadBytes,
  getDownloadURL,
} from "firebase/storage";

import toast from "react-hot-toast";

import {
  Star,
  Trash2,
  Pencil,
  Eye,
} from "lucide-react";

type Post = {
  id: string;
  title: string;
  city: string;
  price: number;
  description: string;
  imageUrl: string;
  featured?: boolean;
};

export default function Dashboard() {

  const [user, setUser] =
    useState<any>(null);

  const [posts, setPosts] =
    useState<Post[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [editingPost, setEditingPost] =
    useState<Post | null>(null);

  const [newImage, setNewImage] =
    useState<File | null>(null);

  const [preview, setPreview] =
    useState<string | null>(null);

  // 🔥 USER
  useEffect(() => {

    const unsub =
      onAuthStateChanged(
        auth,
        (u) => {

          if (u) {

            setUser(u);

            fetchPosts(u.uid);

          } else {

            window.location.href =
              "/login";

          }

        }
      );

    return () => unsub();

  }, []);

  // 🔥 FETCH POSTS
  const fetchPosts = async (
    uid: string
  ) => {

    try {

      const q = query(
        collection(db, "posts"),

        where(
          "userId",
          "==",
          uid
        )
      );

      const snap =
        await getDocs(q);

      const data: Post[] = [];

      snap.forEach((docSnap) => {

        data.push({
          id: docSnap.id,
          ...(docSnap.data() as any),
        });

      });

      setPosts(data);

    } catch (err) {

      console.error(err);

      toast.error(
        "Hiba betöltéskor ❌"
      );

    } finally {

      setLoading(false);

    }

  };

  // ⭐ FEATURED
  const toggleFeatured = async (
    id: string,
    current: boolean | undefined
  ) => {

    try {

      await updateDoc(
        doc(db, "posts", id),
        {
          featured: !current,
        }
      );

      setPosts((prev) =>
        prev.map((post) =>
          post.id === id
            ? {
                ...post,
                featured: !current,
              }
            : post
        )
      );

      toast.success(
        !current
          ? "Kiemelve ⭐"
          : "Kiemelés levéve"
      );

    } catch (err) {

      console.error(err);

      toast.error(
        "Hiba kiemeléskor ❌"
      );

    }

  };

  // 🗑️ DELETE
  const handleDelete = async (
    id: string
  ) => {

    if (
      !confirm(
        "Biztos törlöd?"
      )
    ) return;

    try {

      await deleteDoc(
        doc(db, "posts", id)
      );

      setPosts((prev) =>
        prev.filter(
          (p) => p.id !== id
        )
      );

      toast.success(
        "Törölve ✅"
      );

    } catch (err) {

      console.error(err);

      toast.error(
        "Hiba törléskor ❌"
      );

    }

  };

  // ✏️ UPDATE
  const handleUpdate = async () => {

    if (!editingPost) return;

    try {

      let imageUrl =
        editingPost.imageUrl;

      // NEW IMAGE
      if (newImage) {

        const fileName =
          `${Date.now()}-${newImage.name}`;

        const imageRef = ref(
          storage,
          `images/${fileName}`
        );

        await uploadBytes(
          imageRef,
          newImage
        );

        imageUrl =
          await getDownloadURL(
            imageRef
          );

      }

      const refDoc = doc(
        db,
        "posts",
        editingPost.id
      );

      await updateDoc(refDoc, {
        title:
          editingPost.title,
        city:
          editingPost.city,
        price:
          editingPost.price,
        description:
          editingPost.description,
        imageUrl,
      });

      setPosts((prev) =>
        prev.map((p) =>
          p.id ===
          editingPost.id
            ? {
                ...editingPost,
                imageUrl,
              }
            : p
        )
      );

      setEditingPost(null);

      setNewImage(null);

      setPreview(null);

      toast.success(
        "Frissítve ✨"
      );

    } catch (err) {

      console.error(err);

      toast.error(
        "Hiba frissítéskor ❌"
      );

    }

  };

  // LOADING
  if (loading) {

    return (
      <div
        className="
          flex
          min-h-screen
          items-center
          justify-center
          bg-black
          text-white
        "
      >
        Betöltés...
      </div>
    );

  }

  return (
    <div
      className="
        min-h-screen
        bg-black
        p-6
        text-white
      "
    >

      {/* HEADER */}
      <div className="mb-10">

        <div
          className="
            inline-flex
            items-center
            gap-2
            rounded-full
            border border-emerald-500/20
            bg-emerald-500/10
            px-4
            py-2
            text-sm
            text-emerald-400
            backdrop-blur-xl
          "
        >
          📊 Dashboard
        </div>

        <h1
          className="
            mt-4
            text-4xl
            font-black
          "
        >
          Saját ingatlanjaid kezelése
        </h1>

        {user && (
          <p className="mt-3 text-zinc-400">
            Bejelentkezve:
            {" "}
            {user.email}
          </p>
        )}

      </div>

      {/* EMPTY */}
      {posts.length === 0 && (

        <div
          className="
            rounded-3xl
            border border-zinc-800
            bg-zinc-900
            p-10
            text-center
            text-zinc-400
          "
        >
          Nincs még ingatlanod 😢
        </div>

      )}

      {/* GRID */}
      <div
        className="
          grid
          gap-8
          md:grid-cols-2
          xl:grid-cols-3
        "
      >

        {posts.map((post) => (

          <div
            key={post.id}
            className="
              overflow-hidden
              rounded-3xl
              border border-zinc-800
              bg-zinc-900
              shadow-xl
              transition
              hover:-translate-y-1
              hover:border-emerald-500/40
            "
          >

            {/* IMAGE */}
            <div className="relative">

              <img
                src={post.imageUrl}
                className="
                  h-56
                  w-full
                  object-cover
                "
              />

              {/* FEATURED */}
              {post.featured && (
                <div
                  className="
                    absolute
                    left-4
                    top-4
                    rounded-full
                    bg-yellow-400
                    px-3
                    py-1
                    text-xs
                    font-bold
                    text-black
                    shadow-lg
                  "
                >
                  ⭐ KIEMELT
                </div>
              )}

            </div>

            {/* CONTENT */}
            <div className="p-5">

              <h2
                className="
                  text-2xl
                  font-bold
                "
              >
                {post.title}
              </h2>

              <p className="mt-1 text-zinc-400">
                📍 {post.city}
              </p>

              <p
                className="
                  mt-4
                  text-2xl
                  font-black
                  text-emerald-400
                "
              >
                {post.price.toLocaleString()}
                {" "}
                Ft
              </p>

              {/* BUTTONS */}
              <div className="mt-5 flex flex-wrap gap-2">

                <a
                  href={`/post/${post.id}`}
                  className="
                    inline-flex
                    items-center
                    gap-2
                    rounded-xl
                    bg-emerald-500
                    px-4
                    py-2
                    font-semibold
                    text-white
                    transition
                    hover:bg-emerald-400
                  "
                >
                  <Eye size={18} />
                  Megnézem
                </a>

                <button
                  onClick={() =>
                    setEditingPost(post)
                  }
                  className="
                    inline-flex
                    items-center
                    gap-2
                    rounded-xl
                    bg-blue-600
                    px-4
                    py-2
                    font-semibold
                    text-white
                    transition
                    hover:bg-blue-500
                  "
                >
                  <Pencil size={18} />
                  Szerkesztés
                </button>

                <button
                  onClick={() =>
                    toggleFeatured(
                      post.id,
                      post.featured
                    )
                  }
                  className={`
                    inline-flex
                    items-center
                    gap-2
                    rounded-xl
                    px-4
                    py-2
                    font-semibold
                    text-white
                    transition

                    ${
                      post.featured
                        ? "bg-yellow-500 hover:bg-yellow-400"
                        : "bg-zinc-700 hover:bg-zinc-600"
                    }
                  `}
                >
                  <Star size={18} />

                  {post.featured
                    ? "Kiemelt"
                    : "Kiemelés"}
                </button>

                <button
                  onClick={() =>
                    handleDelete(post.id)
                  }
                  className="
                    inline-flex
                    items-center
                    gap-2
                    rounded-xl
                    bg-red-600
                    px-4
                    py-2
                    font-semibold
                    text-white
                    transition
                    hover:bg-red-500
                  "
                >
                  <Trash2 size={18} />
                  Törlés
                </button>

              </div>

            </div>

          </div>

        ))}

      </div>

      {/* ✏️ MODAL */}
      {editingPost && (

        <div
          className="
            fixed
            inset-0
            z-50
            flex
            items-center
            justify-center
            bg-black/70
            p-4
            backdrop-blur-sm
          "
        >

          <div
            className="
              w-full
              max-w-md
              rounded-3xl
              border border-zinc-800
              bg-zinc-900
              p-6
            "
          >

            <h2
              className="
                mb-5
                text-2xl
                font-bold
              "
            >
              ✏️ Szerkesztés
            </h2>

            <input
              className="
                mb-3
                w-full
                rounded-xl
                border border-zinc-700
                bg-zinc-800
                p-3
                outline-none
                focus:border-emerald-500
              "
              value={editingPost.title}
              onChange={(e) =>
                setEditingPost({
                  ...editingPost,
                  title:
                    e.target.value,
                })
              }
              placeholder="Cím"
            />

            <input
              className="
                mb-3
                w-full
                rounded-xl
                border border-zinc-700
                bg-zinc-800
                p-3
                outline-none
                focus:border-emerald-500
              "
              value={editingPost.city}
              onChange={(e) =>
                setEditingPost({
                  ...editingPost,
                  city:
                    e.target.value,
                })
              }
              placeholder="Város"
            />

            <input
              type="number"
              className="
                mb-3
                w-full
                rounded-xl
                border border-zinc-700
                bg-zinc-800
                p-3
                outline-none
                focus:border-emerald-500
              "
              value={editingPost.price}
              onChange={(e) =>
                setEditingPost({
                  ...editingPost,
                  price: Number(
                    e.target.value
                  ),
                })
              }
              placeholder="Ár"
            />

            <textarea
              className="
                mb-3
                w-full
                rounded-xl
                border border-zinc-700
                bg-zinc-800
                p-3
                outline-none
                focus:border-emerald-500
              "
              value={
                editingPost.description
              }
              onChange={(e) =>
                setEditingPost({
                  ...editingPost,
                  description:
                    e.target.value,
                })
              }
              placeholder="Leírás"
            />

            {/* IMAGE */}
            <input
              type="file"
              className="mb-3"
              onChange={(e) => {

                const file =
                  e.target.files?.[0];

                if (file) {

                  setNewImage(file);

                  setPreview(
                    URL.createObjectURL(
                      file
                    )
                  );

                }

              }}
            />

            {/* PREVIEW */}
            {preview && (

              <img
                src={preview}
                className="
                  mt-2
                  h-44
                  w-full
                  rounded-xl
                  object-cover
                "
              />

            )}

            {/* ACTIONS */}
            <div className="mt-5 flex gap-3">

              <button
                onClick={handleUpdate}
                className="
                  rounded-xl
                  bg-emerald-500
                  px-5
                  py-3
                  font-semibold
                  text-white
                  transition
                  hover:bg-emerald-400
                "
              >
                Mentés
              </button>

              <button
                onClick={() => {

                  setEditingPost(
                    null
                  );

                  setPreview(
                    null
                  );

                  setNewImage(
                    null
                  );

                }}
                className="
                  rounded-xl
                  bg-zinc-700
                  px-5
                  py-3
                  font-semibold
                  text-white
                  transition
                  hover:bg-zinc-600
                "
              >
                Mégse
              </button>

            </div>

          </div>

        </div>

      )}

    </div>
  );
}