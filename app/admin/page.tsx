"use client";
import { useConfirmation } from "@/app/lib/useConfirmation";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, type User } from "firebase/auth";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
} from "firebase/firestore";
import toast from "react-hot-toast";
import {
  Eye,
  Pencil,
  Search,
  ShieldCheck,
  Star,
  Archive,
  RotateCcw,
  Users,
} from "lucide-react";

import UserManagement from "@/app/components/admin/UserManagement";
import InquiryManagement from "@/app/components/admin/InquiryManagement";
import { missingPropertyFields } from "@/app/lib/managementPolicy";
import { managementRequest } from "@/app/lib/managementClient";
import { auth, db } from "../lib/firebase";
import {
  propertyFromFirestore,
  type PropertyStatus,
  type PropertyWithId,
} from "../lib/types";

type AdminUser = {
  id: string;
  email: string;
  role: "user" | "admin";
  createdAt?: unknown;
};

type StatusOption = {
  value: PropertyStatus;
  label: string;
};

const STATUS_OPTIONS: StatusOption[] = [
  { value: "active", label: "Aktív" },
  { value: "draft", label: "Piszkozat" },
  { value: "sold", label: "Eladva" },
  { value: "inactive", label: "Inaktív" },
  { value: "archived", label: "Archivált" },
];

const statusClass: Record<PropertyStatus, string> = {
  archived: "border-stone-300 bg-stone-100 text-stone-700",
  active: "border-emerald-500/30 bg-[#176b3a]/10 text-[#176b3a]",
  draft: "border-amber-500/30 bg-amber-500/10 text-amber-300",
  sold: "border-blue-500/30 bg-[#176b3a]/10 text-blue-300",
  inactive: "border-[#cbc4b7] bg-[#f5f2ec] text-[#4d5a51]",
};

export default function AdminPage() {
  const router = useRouter();
  const { confirm: confirmAction, dialog: confirmationDialog } =
    useConfirmation();

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<PropertyWithId[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [propertySearch, setPropertySearch] = useState("");
  const [incompleteOnly, setIncompleteOnly] = useState(false);
  const [statusFilter, setStatusFilter] = useState<"all" | PropertyStatus>(
    "all",
  );

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.replace("/login");
        return;
      }
      if (!user.emailVerified) {
        router.replace("/login?verify=1");
        return;
      }

      try {
        const userRef = doc(db, "users", user.uid);
        const snapshot = await getDoc(userRef);

        if (!snapshot.exists() || snapshot.data().role !== "admin") {
          router.replace("/");
          return;
        }

        setCurrentUser(user);
        await loadAdminData();
      } catch (error) {
        console.error(error);
        toast.error("Nem sikerült betölteni az admin felületet.");
        router.replace("/");
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  const loadAdminData = async () => {
    const [postSnapshot, userSnapshot] = await Promise.all([
      getDocs(collection(db, "posts")),
      getDocs(collection(db, "users")),
    ]);

    setPosts(
      postSnapshot.docs.map((item) =>
        propertyFromFirestore(item.id, item.data()),
      ),
    );

    setUsers(
      userSnapshot.docs.map((item) => {
        const data = item.data();
        return {
          id: item.id,
          email: typeof data.email === "string" ? data.email : "Nincs e-mail",
          role: data.role === "admin" ? "admin" : "user",
          createdAt: data.createdAt,
        };
      }),
    );
  };

  useEffect(() => {
    if (!currentUser) return;
    return onSnapshot(
      collection(db, "posts"),
      (snapshot) =>
        setPosts(
          snapshot.docs.map((item) =>
            propertyFromFirestore(item.id, item.data()),
          ),
        ),
      () => toast.error("Az élő frissítés megszakadt. Frissítsd az oldalt."),
    );
  }, [currentUser]);
  const stats = useMemo(
    () => ({
      users: users.length,
      admins: users.filter((item) => item.role === "admin").length,
      allPosts: posts.length,
      active: posts.filter((item) => item.status === "active").length,
      draft: posts.filter((item) => item.status === "draft").length,
      sold: posts.filter((item) => item.status === "sold").length,
      featured: posts.filter((item) => item.featured).length,
    }),
    [posts, users],
  );

  const filteredPosts = useMemo(() => {
    const needle = propertySearch.trim().toLowerCase();

    return posts.filter((post) => {
      const matchesStatus =
        statusFilter === "all" || post.status === statusFilter;
      const matchesSearch =
        !needle ||
        [post.title, post.city, post.district, post.email, post.propertyType]
          .filter(Boolean)
          .some((value) => value.toLowerCase().includes(needle));

      return (
        matchesStatus &&
        matchesSearch &&
        (!incompleteOnly || missingPropertyFields(post).length > 0)
      );
    });
  }, [posts, propertySearch, statusFilter, incompleteOnly]);

  const changeStatus = async (post: PropertyWithId, status: PropertyStatus) => {
    if (post.status === status) return;

    try {
      setBusyId(post.id);
      await managementRequest(
        `/api/posts/${post.id}`,
        {
          action: "update",
          expectedVersion: post.version || 0,
          patch: { status },
        },
        "PATCH",
      );
      toast.success("Hirdetés státusza frissítve.");
    } catch (error) {
      console.error(error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Nem sikerült módosítani a státuszt.",
      );
    } finally {
      setBusyId(null);
    }
  };

  const toggleFeatured = async (post: PropertyWithId) => {
    try {
      setBusyId(post.id);
      const featured = !post.featured;
      await managementRequest(
        `/api/posts/${post.id}`,
        {
          action: "update",
          expectedVersion: post.version || 0,
          patch: { featured },
        },
        "PATCH",
      );
      toast.success(featured ? "Hirdetés kiemelve." : "Kiemelés megszüntetve.");
    } catch (error) {
      console.error(error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Nem sikerült módosítani a kiemelést.",
      );
    } finally {
      setBusyId(null);
    }
  };

  const deletePost = async (post: PropertyWithId) => {
    const confirmed = await confirmAction(
      `Biztosan ${post.status === "archived" ? "visszaállítod" : "archiválod"} ezt a hirdetést?\n\n${post.title}`,
    );
    if (!confirmed) return;

    try {
      setBusyId(post.id);
      await managementRequest(
        `/api/posts/${post.id}`,
        {
          action: post.status === "archived" ? "unarchive" : "archive",
          expectedVersion: post.version || 0,
        },
        "PATCH",
      );
      await loadAdminData();
      toast.success("Hirdetés állapota módosítva.");
    } catch (error) {
      console.error(error);
      toast.error(
        error instanceof Error ? error.message : "A művelet nem sikerült.",
      );
    } finally {
      setBusyId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f7f4ee] text-[#18201b]">
        Admin betöltése...
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f4ee] px-4 py-8 text-[#18201b] sm:px-6">
      {confirmationDialog}
      <div className="mx-auto max-w-7xl">
        <header className="mb-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#b9d1c0] bg-[#176b3a]/10 px-4 py-2 text-sm text-[#176b3a]">
            <ShieldCheck size={16} /> Adminisztráció
          </div>
          <h1 className="mt-4 text-3xl font-black sm:text-4xl">
            DebrecenHomes Admin PRO
          </h1>
          <p className="mt-2 text-[#6c776f]">
            Valós idejű platformkezelés: hirdetések, kiemelések, státuszok és
            felhasználói jogosultságok.
          </p>
          {currentUser?.email && (
            <p className="mt-2 text-sm text-[#879087]">
              Admin: <span className="break-all">{currentUser.email}</span>
            </p>
          )}
        </header>

        <section className="mb-10 grid grid-cols-2 gap-3 lg:grid-cols-4 xl:grid-cols-7">
          <StatCard label="Felhasználói profilok" value={stats.users} />
          <StatCard label="Adminok" value={stats.admins} />
          <StatCard label="Hirdetések" value={stats.allPosts} />
          <StatCard label="Aktív" value={stats.active} />
          <StatCard label="Piszkozat" value={stats.draft} />
          <StatCard label="Eladva" value={stats.sold} />
          <StatCard label="Kiemelt" value={stats.featured} />
        </section>

        <section className="mb-12">
          <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="text-2xl font-black">Hirdetések kezelése</h2>
              <p className="mt-1 text-sm text-[#879087]">
                {filteredPosts.length} hirdetés látható a szűrés után.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-[minmax(220px,1fr)_180px]">
              <label className="col-span-full flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={incompleteOnly}
                  onChange={(e) => setIncompleteOnly(e.target.checked)}
                />{" "}
                Csak hiányos adatokkal
              </label>
              <div className="relative">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[#879087]"
                  size={17}
                />
                <input
                  value={propertySearch}
                  onChange={(event) => setPropertySearch(event.target.value)}
                  placeholder="Cím, város, e-mail..."
                  className="w-full rounded-xl border border-[#d8d2c7] bg-white py-2.5 pl-10 pr-3 text-sm outline-none focus:border-[#176b3a]"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value as "all" | PropertyStatus)
                }
                className="rounded-xl border border-[#d8d2c7] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#176b3a]"
              >
                <option value="all">Minden státusz</option>
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {filteredPosts.length === 0 ? (
            <EmptyState text="Nincs a szűrésnek megfelelő hirdetés." />
          ) : (
            <div className="overflow-x-auto rounded-3xl border border-[#e2ddd3] bg-white">
              <table className="dh-admin-table min-w-[1050px] w-full text-left text-sm">
                <thead className="border-b border-[#e2ddd3] text-xs uppercase tracking-wide text-[#879087]">
                  <tr>
                    <th className="px-5 py-4">Ingatlan</th>
                    <th className="px-5 py-4">Ár</th>
                    <th className="px-5 py-4">Státusz</th>
                    <th className="px-5 py-4">Kiemelés</th>
                    <th className="px-5 py-4">Tulajdonos</th>
                    <th className="px-5 py-4 text-right">Műveletek</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPosts.map((post) => {
                    const busy = busyId === post.id;
                    const statusLabel =
                      STATUS_OPTIONS.find((item) => item.value === post.status)
                        ?.label ?? post.status;

                    return (
                      <tr
                        key={post.id}
                        className="border-b border-[#e2ddd3]/70 last:border-0"
                      >
                        <td data-label="Ingatlan" className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            {post.imageUrl ? (
                              <img
                                src={post.imageUrl}
                                alt={post.title || "Ingatlan"}
                                className="h-14 w-20 rounded-xl object-cover"
                              />
                            ) : (
                              <div className="flex h-14 w-20 items-center justify-center rounded-xl bg-[#f5f2ec] text-xs text-[#9aa29b]">
                                Nincs kép
                              </div>
                            )}
                            <div>
                              <p className="max-w-xs font-bold">
                                {post.title || "Névtelen hirdetés"}
                              </p>
                              <p className="mt-2 text-xs">
                                Kitöltöttség:{" "}
                                {Math.round(
                                  ((5 - missingPropertyFields(post).length) /
                                    5) *
                                    100,
                                )}
                                %
                              </p>
                              {missingPropertyFields(post).length > 0 && (
                                <Link
                                  href={`/edit/${post.id}`}
                                  className="mt-1 block text-xs font-semibold text-amber-800 underline"
                                >
                                  Hiányzik:{" "}
                                  {missingPropertyFields(post).join(", ")} –
                                  kitöltés
                                </Link>
                              )}
                              <p className="mt-1 text-xs text-[#879087]">
                                {[post.city, post.district]
                                  .filter(Boolean)
                                  .join(", ") || "Nincs helyszín"}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td data-label="Ár" className="px-5 py-4 font-semibold text-[#176b3a]">
                          {post.price.toLocaleString("hu-HU")} Ft
                        </td>
                        <td data-label="Státusz" className="px-5 py-4">
                          <div className="flex flex-col gap-2">
                            <span
                              className={`w-fit rounded-full border px-2.5 py-1 text-xs font-bold ${statusClass[post.status]}`}
                            >
                              {statusLabel}
                            </span>
                            <select
                              value={post.status}
                              disabled={busy || post.status === "archived"}
                              onChange={(event) =>
                                void changeStatus(
                                  post,
                                  event.target.value as PropertyStatus,
                                )
                              }
                              className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-[#d8d2c7] bg-[#f5f2ec] px-2 py-1.5 text-xs outline-none disabled:opacity-50"
                            >
                              {STATUS_OPTIONS.filter(
                                (option) =>
                                  option.value !== "archived" ||
                                  post.status === "archived",
                              ).map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          </div>
                        </td>
                        <td data-label="Kiemelés" className="px-5 py-4">
                          <button
                            type="button"
                            disabled={busy || post.status === "archived"}
                            onClick={() => void toggleFeatured(post)}
                            className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold transition disabled:opacity-50 ${
                              post.featured
                                ? "bg-[#ead8a5] text-[#172019] hover:bg-yellow-300"
                                : "border border-[#d8d2c7] bg-[#f5f2ec] text-[#4d5a51] hover:border-[#b99445]"
                            }`}
                          >
                            <Star
                              size={14}
                              fill={post.featured ? "currentColor" : "none"}
                            />
                            {post.featured ? "Kiemelt" : "Kiemelés"}
                          </button>
                        </td>
                        <td data-label="Tulajdonos" className="px-5 py-4 text-xs text-[#6c776f]">
                          <div>{post.email || "Nincs e-mail"}</div>
                          <div
                            className="mt-1 max-w-40 truncate text-[#9aa29b]"
                            title={post.userId}
                          >
                            {post.userId || "Nincs userId"}
                          </div>
                        </td>
                        <td data-label="Műveletek" className="px-5 py-4">
                          <div className="flex flex-wrap justify-end gap-2">
                            <Link
                              href={`/post/${post.id}`}
                              className="rounded-lg border border-[#d8d2c7] bg-[#f5f2ec] p-2 transition hover:border-emerald-500"
                              title="Megnézem"
                            >
                              <Eye size={16} />
                            </Link>
                            <Link
                              href={`/edit/${post.id}`}
                              className="rounded-lg border border-[#d8d2c7] bg-[#f5f2ec] p-2 transition hover:border-blue-500"
                              title="Szerkesztés"
                            >
                              <Pencil size={16} />
                            </Link>
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => void deletePost(post)}
                              className="rounded-lg border border-red-500/30 bg-red-500/10 p-2 text-red-300 transition hover:bg-red-500/20 disabled:opacity-50"
                              title={
                                post.status === "archived"
                                  ? "Visszaállítás"
                                  : "Archiválás"
                              }
                            >
                              {post.status === "archived" ? (
                                <RotateCcw size={16} />
                              ) : (
                                <Archive size={16} />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {currentUser && (
          <>
            <InquiryManagement />
            <UserManagement actorUid={currentUser.uid} />
          </>
        )}
      </div>
    </main>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-[#e2ddd3] bg-white p-5">
      <p className="text-xs uppercase tracking-wide text-[#879087]">{label}</p>
      <p className="mt-2 text-3xl font-black text-[#18201b]">{value}</p>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-3xl border border-[#e2ddd3] bg-white p-8 text-center text-[#6c776f]">
      {text}
    </div>
  );
}
