"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { onAuthStateChanged, type User } from "firebase/auth";
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { deleteObject, ref } from "firebase/storage";
import toast from "react-hot-toast";
import {
  CirclePlus,
  Eye,
  Pencil,
  Star,
  Trash2,
} from "lucide-react";

import { auth, db, storage } from "../lib/firebase";
import {
  propertyFromFirestore,
  type PropertyStatus,
  type PropertyWithId,
} from "../lib/types";

type Post = PropertyWithId;

type StatusOption = {
  value: PropertyStatus;
  label: string;
};

const STATUS_OPTIONS: StatusOption[] = [
  { value: "active", label: "Aktív" },
  { value: "draft", label: "Piszkozat" },
  { value: "sold", label: "Eladva" },
  { value: "inactive", label: "Inaktív" },
];

const statusClass: Record<PropertyStatus, string> = {
  active: "border-emerald-500/30 bg-[#176b3a]/10 text-[#176b3a]",
  draft: "border-amber-500/30 bg-amber-500/10 text-amber-300",
  sold: "border-blue-500/30 bg-[#176b3a]/10 text-blue-300",
  inactive: "border-[#cbc4b7] bg-[#f5f2ec] text-[#4d5a51]",
};

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        window.location.href = "/login";
        return;
      }
      setUser(currentUser);
      void fetchPosts(currentUser.uid);
    });

    return () => unsubscribe();
  }, []);

  const fetchPosts = async (uid: string) => {
    try {
      setLoading(true);
      const propertyQuery = query(
        collection(db, "posts"),
        where("userId", "==", uid)
      );
      const snapshot = await getDocs(propertyQuery);
      const data = snapshot.docs.map((item) =>
        propertyFromFirestore(item.id, item.data())
      );
      setPosts(data);
    } catch (error) {
      console.error(error);
      toast.error("Nem sikerült betölteni az ingatlanokat.");
    } finally {
      setLoading(false);
    }
  };

  const stats = useMemo(
    () => ({
      all: posts.length,
      active: posts.filter((post) => post.status === "active").length,
      draft: posts.filter((post) => post.status === "draft").length,
      sold: posts.filter((post) => post.status === "sold").length,
    }),
    [posts]
  );

  const handleStatusChange = async (post: Post, nextStatus: PropertyStatus) => {
    if (post.status === nextStatus) return;

    try {
      setBusyId(post.id);
      await updateDoc(doc(db, "posts", post.id), {
        status: nextStatus,
        updatedAt: serverTimestamp(),
      });
      setPosts((current) =>
        current.map((item) =>
          item.id === post.id ? { ...item, status: nextStatus } : item
        )
      );
      toast.success("Státusz frissítve.");
    } catch (error) {
      console.error(error);
      toast.error("Nem sikerült módosítani a státuszt.");
    } finally {
      setBusyId(null);
    }
  };

  const removeStoredImages = async (post: Post) => {
    const urls = Array.from(
      new Set([post.imageUrl, ...post.images].filter(Boolean))
    );

    await Promise.allSettled(
      urls.map(async (url) => {
        try {
          await deleteObject(ref(storage, url));
        } catch (error) {
          // Régi, más struktúrában tárolt képnél a fájl törlése meghiúsulhat.
          // Ettől a hirdetés Firestore törlése még biztonságosan végrehajtható.
          console.warn("Kép nem törölhető a Storage-ból:", url, error);
        }
      })
    );
  };

  const handleDelete = async (post: Post) => {
    const confirmed = window.confirm(
      `Biztosan végleg törlöd ezt a hirdetést?\n\n${post.title}`
    );
    if (!confirmed) return;

    try {
      setBusyId(post.id);
      await deleteDoc(doc(db, "posts", post.id));
      await removeStoredImages(post);
      setPosts((current) => current.filter((item) => item.id !== post.id));
      toast.success("A hirdetés törölve.");
    } catch (error) {
      console.error(error);
      toast.error("Nem sikerült törölni a hirdetést.");
    } finally {
      setBusyId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f7f4ee] text-[#18201b]">
        Ingatlanok betöltése...
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f4ee] px-4 py-8 text-[#18201b] sm:px-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="inline-flex items-center rounded-full border border-[#b9d1c0] bg-[#176b3a]/10 px-4 py-2 text-sm text-[#176b3a]">
              Saját hirdetések
            </div>
            <h1 className="mt-4 text-3xl font-black sm:text-4xl">
              Ingatlanjaid kezelése
            </h1>
            {user?.email && (
              <p className="mt-2 text-[#6c776f]">Bejelentkezve: {user.email}</p>
            )}
          </div>

          <Link
            href="/create"
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#176b3a] px-5 py-3 font-bold text-white transition hover:bg-[#115b30]"
          >
            <CirclePlus size={20} /> Új ingatlan
          </Link>
        </div>

        <div className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Összes" value={stats.all} />
          <StatCard label="Aktív" value={stats.active} />
          <StatCard label="Piszkozat" value={stats.draft} />
          <StatCard label="Eladva" value={stats.sold} />
        </div>

        {posts.length === 0 ? (
          <div className="rounded-3xl border border-[#e2ddd3] bg-white p-10 text-center">
            <h2 className="text-xl font-bold">Még nincs feltöltött ingatlanod.</h2>
            <p className="mt-2 text-[#6c776f]">
              Az első hirdetésedet az „Új ingatlan” gombbal hozhatod létre.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {posts.map((post) => {
              const statusLabel =
                STATUS_OPTIONS.find((option) => option.value === post.status)
                  ?.label ?? "Aktív";
              const busy = busyId === post.id;

              return (
                <article
                  key={post.id}
                  className="overflow-hidden rounded-3xl border border-[#e2ddd3] bg-white shadow-xl"
                >
                  <div className="relative bg-[#f5f2ec]">
                    {post.imageUrl ? (
                      <img
                        src={post.imageUrl}
                        alt={post.title || "Ingatlan"}
                        className="h-56 w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-56 items-center justify-center text-[#879087]">
                        Nincs borítókép
                      </div>
                    )}

                    <div className="absolute left-4 top-4 flex flex-wrap gap-2">
                      <span
                        className={`rounded-full border px-3 py-1 text-xs font-bold ${statusClass[post.status]}`}
                      >
                        {statusLabel}
                      </span>
                      {post.featured && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-[#ead8a5] px-3 py-1 text-xs font-bold text-[#172019]">
                          <Star size={13} fill="currentColor" /> Kiemelt
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="p-5">
                    <h2 className="text-xl font-bold">{post.title}</h2>
                    <p className="mt-1 text-[#6c776f]">
                      📍 {[post.city, post.district].filter(Boolean).join(", ")}
                    </p>
                    <p className="mt-2 min-h-5 text-sm text-[#879087]">
                      {[
                        post.propertyType,
                        post.area ? `${post.area} m²` : "",
                        post.rooms ? `${post.rooms} szoba` : "",
                      ]
                        .filter(Boolean)
                        .join(" • ")}
                    </p>
                    <p className="mt-4 text-2xl font-black text-[#176b3a]">
                      {post.price.toLocaleString("hu-HU")} Ft
                    </p>

                    <div className="mt-5">
                      <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-[#879087]">
                        Hirdetés státusza
                      </label>
                      <select
                        value={post.status}
                        disabled={busy}
                        onChange={(event) =>
                          void handleStatusChange(
                            post,
                            event.target.value as PropertyStatus
                          )
                        }
                        className="w-full rounded-xl border border-[#d8d2c7] bg-[#f5f2ec] px-3 py-2 text-sm outline-none focus:border-[#176b3a] disabled:opacity-50"
                      >
                        {STATUS_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="mt-5 grid grid-cols-2 gap-2">
                      <Link
                        href={`/post/${post.id}`}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#176b3a] px-3 py-2 font-semibold text-white transition hover:bg-[#115b30]"
                      >
                        <Eye size={17} /> Megnézem
                      </Link>
                      <Link
                        href={`/edit/${post.id}`}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#176b3a] px-3 py-2 font-semibold text-white transition hover:bg-[#115b30]"
                      >
                        <Pencil size={17} /> Szerkesztés
                      </Link>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => void handleDelete(post)}
                        className="col-span-2 inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-3 py-2 font-semibold transition hover:bg-red-500 disabled:opacity-50"
                      >
                        <Trash2 size={17} />
                        {busy ? "Művelet..." : "Hirdetés törlése"}
                      </button>
                    </div>

                    {post.featured && (
                      <p className="mt-4 text-xs text-[#879087]">
                        A kiemelést az admin kezeli; a hirdető nem módosíthatja.
                      </p>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-[#e2ddd3] bg-white p-5">
      <p className="text-sm text-[#879087]">{label}</p>
      <p className="mt-1 text-3xl font-black">{value}</p>
    </div>
  );
}
