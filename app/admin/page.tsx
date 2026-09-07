"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, type User } from "firebase/auth";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  updateDoc,
  writeBatch,
} from "firebase/firestore";
import toast from "react-hot-toast";
import {
  Eye,
  Pencil,
  Database,
  Search,
  ShieldCheck,
  Star,
  Trash2,
  Users,
} from "lucide-react";

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
];

const statusClass: Record<PropertyStatus, string> = {
  active: "border-emerald-500/30 bg-[#176b3a]/10 text-[#176b3a]",
  draft: "border-amber-500/30 bg-amber-500/10 text-amber-300",
  sold: "border-blue-500/30 bg-[#176b3a]/10 text-blue-300",
  inactive: "border-[#cbc4b7] bg-[#f5f2ec] text-[#4d5a51]",
};

export default function AdminPage() {
  const router = useRouter();

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<PropertyWithId[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [migrationBusy, setMigrationBusy] = useState(false);
  const [propertySearch, setPropertySearch] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | PropertyStatus>("all");

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
        propertyFromFirestore(item.id, item.data())
      )
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
      })
    );
  };

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
    [posts, users]
  );

  const filteredPosts = useMemo(() => {
    const needle = propertySearch.trim().toLowerCase();

    return posts.filter((post) => {
      const matchesStatus = statusFilter === "all" || post.status === statusFilter;
      const matchesSearch =
        !needle ||
        [post.title, post.city, post.district, post.email, post.propertyType]
          .filter(Boolean)
          .some((value) => value.toLowerCase().includes(needle));

      return matchesStatus && matchesSearch;
    });
  }, [posts, propertySearch, statusFilter]);

  const filteredUsers = useMemo(() => {
    const needle = userSearch.trim().toLowerCase();
    if (!needle) return users;

    return users.filter((item) =>
      [item.email, item.role].some((value) => value.toLowerCase().includes(needle))
    );
  }, [users, userSearch]);

  const migrateLegacyPosts = async () => {
    const confirmed = window.confirm(
      "Régi hirdetések migrálása\n\n" +
        "Csak a hiányzó mezőket tölti ki:\n" +
        "• status → active\n" +
        "• listingType → a cím alapján sale / rent\n\n" +
        "Meglévő status vagy listingType értéket nem ír felül.\n\n" +
        "Folytatod?"
    );
    if (!confirmed) return;

    try {
      setMigrationBusy(true);

      const snapshot = await getDocs(collection(db, "posts"));
      const candidates = snapshot.docs.filter((item) => {
        const data = item.data();
        return !("status" in data) || !("listingType" in data);
      });

      if (candidates.length === 0) {
        toast.success("Nincs migrálandó régi hirdetés.");
        return;
      }

      const batch = writeBatch(db);
      let statusAdded = 0;
      let listingTypeAdded = 0;

      candidates.forEach((item) => {
        const data = item.data();
        const updates: Record<string, unknown> = {
          updatedAt: serverTimestamp(),
        };

        if (!("status" in data)) {
          updates.status = "active";
          statusAdded += 1;
        }

        if (!("listingType" in data)) {
          const title =
            typeof data.title === "string"
              ? data.title.toLocaleLowerCase("hu-HU")
              : "";

          updates.listingType =
            title.includes("kiadó") || title.includes("kiado")
              ? "rent"
              : "sale";
          listingTypeAdded += 1;
        }

        batch.update(item.ref, updates);
      });

      await batch.commit();
      await loadAdminData();

      toast.success(
        `Migráció kész: ${candidates.length} hirdetés, ${statusAdded} status, ${listingTypeAdded} hirdetéstípus.`
      );
    } catch (error) {
      console.error("Régi hirdetések migrációs hiba:", error);
      toast.error("A migráció nem sikerült. Semmit ne módosíts kézzel; nézd meg a konzolt.");
    } finally {
      setMigrationBusy(false);
    }
  };

  const changeStatus = async (post: PropertyWithId, status: PropertyStatus) => {
    if (post.status === status) return;

    try {
      setBusyId(post.id);
      await updateDoc(doc(db, "posts", post.id), {
        status,
        updatedAt: serverTimestamp(),
      });
      setPosts((current) =>
        current.map((item) => (item.id === post.id ? { ...item, status } : item))
      );
      toast.success("Hirdetés státusza frissítve.");
    } catch (error) {
      console.error(error);
      toast.error("Nem sikerült módosítani a státuszt.");
    } finally {
      setBusyId(null);
    }
  };

  const toggleFeatured = async (post: PropertyWithId) => {
    try {
      setBusyId(post.id);
      const featured = !post.featured;
      await updateDoc(doc(db, "posts", post.id), {
        featured,
        updatedAt: serverTimestamp(),
      });
      setPosts((current) =>
        current.map((item) =>
          item.id === post.id ? { ...item, featured } : item
        )
      );
      toast.success(featured ? "Hirdetés kiemelve." : "Kiemelés megszüntetve.");
    } catch (error) {
      console.error(error);
      toast.error("Nem sikerült módosítani a kiemelést.");
    } finally {
      setBusyId(null);
    }
  };

  const deletePost = async (post: PropertyWithId) => {
    const confirmed = window.confirm(
      `Biztosan törlöd ezt a hirdetést?\n\n${post.title}`
    );
    if (!confirmed) return;

    try {
      setBusyId(post.id);
      await deleteDoc(doc(db, "posts", post.id));
      setPosts((current) => current.filter((item) => item.id !== post.id));
      toast.success("Hirdetés törölve.");
    } catch (error) {
      console.error(error);
      toast.error("Nem sikerült törölni a hirdetést.");
    } finally {
      setBusyId(null);
    }
  };

  const changeUserRole = async (item: AdminUser, role: "user" | "admin") => {
    if (item.role === role) return;

    if (currentUser?.uid === item.id) {
      toast.error("A saját admin jogosultságodat itt nem módosíthatod.");
      return;
    }

    const confirmed = window.confirm(
      role === "admin"
        ? `Biztosan admin jogosultságot adsz ennek a felhasználónak?\n\n${item.email}`
        : `Biztosan visszavonod az admin jogosultságot?\n\n${item.email}`
    );
    if (!confirmed) return;

    try {
      setBusyId(item.id);
      await updateDoc(doc(db, "users", item.id), { role });
      setUsers((current) =>
        current.map((user) => (user.id === item.id ? { ...user, role } : user))
      );
      toast.success("Felhasználói jogosultság frissítve.");
    } catch (error) {
      console.error(error);
      toast.error("Nem sikerült módosítani a jogosultságot.");
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
      <div className="mx-auto max-w-7xl">
        <header className="mb-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#b9d1c0] bg-[#176b3a]/10 px-4 py-2 text-sm text-[#176b3a]">
            <ShieldCheck size={16} /> Adminisztráció
          </div>
          <h1 className="mt-4 text-3xl font-black sm:text-4xl">DebrecenHomes Admin PRO</h1>
          <p className="mt-2 text-[#6c776f]">
            Valós idejű platformkezelés: hirdetések, kiemelések, státuszok és felhasználói jogosultságok.
          </p>
          {currentUser?.email && (
            <p className="mt-2 text-sm text-[#879087]">Admin: {currentUser.email}</p>
          )}
        </header>

        <section className="mb-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
          <StatCard label="Felhasználók" value={stats.users} />
          <StatCard label="Adminok" value={stats.admins} />
          <StatCard label="Hirdetések" value={stats.allPosts} />
          <StatCard label="Aktív" value={stats.active} />
          <StatCard label="Piszkozat" value={stats.draft} />
          <StatCard label="Eladva" value={stats.sold} />
          <StatCard label="Kiemelt" value={stats.featured} />
        </section>

        <section className="mb-8 rounded-3xl border border-[#d8d2c7] bg-white p-5 sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex items-center gap-2 font-black">
                <Database size={19} className="text-[#176b3a]" />
                Régi hirdetések egyszeri migrálása
              </div>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-[#6c776f]">
                A régi dokumentumokból hiányzó <strong>status</strong> és
                <strong> listingType</strong> mezőket tölti ki. Meglévő értéket nem ír felül.
                A hiányzó státusz aktív lesz; a kiadó hirdetéseket a cím alapján ismeri fel.
              </p>
            </div>
            <button
              type="button"
              onClick={() => void migrateLegacyPosts()}
              disabled={migrationBusy}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#176b3a] px-5 py-3 text-sm font-black text-white transition hover:bg-[#125b31] disabled:cursor-wait disabled:opacity-60"
            >
              <Database size={17} />
              {migrationBusy ? "Migráció folyamatban..." : "Migráció indítása"}
            </button>
          </div>
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
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#879087]" size={17} />
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
              <table className="min-w-[1050px] w-full text-left text-sm">
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
                      STATUS_OPTIONS.find((item) => item.value === post.status)?.label ??
                      post.status;

                    return (
                      <tr key={post.id} className="border-b border-[#e2ddd3]/70 last:border-0">
                        <td className="px-5 py-4">
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
                              <p className="max-w-xs font-bold">{post.title || "Névtelen hirdetés"}</p>
                              <p className="mt-1 text-xs text-[#879087]">
                                {[post.city, post.district].filter(Boolean).join(", ") || "Nincs helyszín"}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4 font-semibold text-[#176b3a]">
                          {post.price.toLocaleString("hu-HU")} Ft
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex flex-col gap-2">
                            <span className={`w-fit rounded-full border px-2.5 py-1 text-xs font-bold ${statusClass[post.status]}`}>
                              {statusLabel}
                            </span>
                            <select
                              value={post.status}
                              disabled={busy}
                              onChange={(event) =>
                                void changeStatus(post, event.target.value as PropertyStatus)
                              }
                              className="rounded-lg border border-[#d8d2c7] bg-[#f5f2ec] px-2 py-1.5 text-xs outline-none disabled:opacity-50"
                            >
                              {STATUS_OPTIONS.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => void toggleFeatured(post)}
                            className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold transition disabled:opacity-50 ${
                              post.featured
                                ? "bg-[#ead8a5] text-[#172019] hover:bg-yellow-300"
                                : "border border-[#d8d2c7] bg-[#f5f2ec] text-[#4d5a51] hover:border-[#b99445]"
                            }`}
                          >
                            <Star size={14} fill={post.featured ? "currentColor" : "none"} />
                            {post.featured ? "Kiemelt" : "Kiemelés"}
                          </button>
                        </td>
                        <td className="px-5 py-4 text-xs text-[#6c776f]">
                          <div>{post.email || "Nincs e-mail"}</div>
                          <div className="mt-1 max-w-40 truncate text-[#9aa29b]" title={post.userId}>
                            {post.userId || "Nincs userId"}
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex justify-end gap-2">
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
                              title="Törlés"
                            >
                              <Trash2 size={16} />
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

        <section>
          <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="flex items-center gap-2 text-2xl font-black">
                <Users size={22} /> Felhasználók
              </h2>
              <p className="mt-1 text-sm text-[#879087]">
                Jogosultságkezelés a Firestore felhasználói profiljai alapján.
              </p>
            </div>
            <div className="relative w-full sm:max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#879087]" size={17} />
              <input
                value={userSearch}
                onChange={(event) => setUserSearch(event.target.value)}
                placeholder="E-mail vagy szerepkör..."
                className="w-full rounded-xl border border-[#d8d2c7] bg-white py-2.5 pl-10 pr-3 text-sm outline-none focus:border-[#176b3a]"
              />
            </div>
          </div>

          {filteredUsers.length === 0 ? (
            <EmptyState text="Nincs a keresésnek megfelelő felhasználó." />
          ) : (
            <div className="overflow-x-auto rounded-3xl border border-[#e2ddd3] bg-white">
              <table className="min-w-[720px] w-full text-left text-sm">
                <thead className="border-b border-[#e2ddd3] text-xs uppercase tracking-wide text-[#879087]">
                  <tr>
                    <th className="px-5 py-4">E-mail</th>
                    <th className="px-5 py-4">Azonosító</th>
                    <th className="px-5 py-4">Szerepkör</th>
                    <th className="px-5 py-4 text-right">Módosítás</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((item) => {
                    const isSelf = currentUser?.uid === item.id;
                    const busy = busyId === item.id;

                    return (
                      <tr key={item.id} className="border-b border-[#e2ddd3]/70 last:border-0">
                        <td className="px-5 py-4 font-semibold">
                          {item.email}
                          {isSelf && (
                            <span className="ml-2 rounded-full bg-[#176b3a]/10 px-2 py-1 text-xs text-[#176b3a]">
                              Te
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-4 text-xs text-[#879087]">
                          <span className="block max-w-64 truncate" title={item.id}>
                            {item.id}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-bold ${
                              item.role === "admin"
                                ? "bg-[#176b3a]/10 text-[#176b3a]"
                                : "bg-[#f5f2ec] text-[#4d5a51]"
                            }`}
                          >
                            {item.role === "admin" ? "Admin" : "Felhasználó"}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <select
                            value={item.role}
                            disabled={busy || isSelf}
                            onChange={(event) =>
                              void changeUserRole(
                                item,
                                event.target.value as "user" | "admin"
                              )
                            }
                            className="rounded-xl border border-[#d8d2c7] bg-[#f5f2ec] px-3 py-2 text-sm outline-none disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <option value="user">Felhasználó</option>
                            <option value="admin">Admin</option>
                          </select>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
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
