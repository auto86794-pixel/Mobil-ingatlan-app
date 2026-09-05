"use client";

import Link from "next/link";
import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import { Building2, Heart, LayoutDashboard, LogIn, LogOut, Plus } from "lucide-react";
import { useEffect, useState } from "react";

import { auth } from "../lib/firebase";

const navLink =
  "rounded-full px-4 py-2 text-sm font-medium text-zinc-300 transition hover:bg-white/5 hover:text-white";

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => onAuthStateChanged(auth, setUser), []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Kijelentkezési hiba:", error);
    }
  };

  return (
    <nav className="sticky top-0 z-50 hidden border-b border-white/10 bg-zinc-950/88 backdrop-blur-2xl md:block">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3.5">
        <div className="flex items-center gap-8">
          <Link href="/" className="group flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-emerald-400/20 bg-emerald-400/10 text-emerald-300 transition group-hover:bg-emerald-400/15">
              <Building2 size={22} strokeWidth={1.8} />
            </div>
            <div>
              <div className="text-base font-black tracking-tight text-white">DebrecenHomes</div>
              <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-zinc-500">Debreceni ingatlanok</div>
            </div>
          </Link>

          <div className="flex items-center gap-1">
            <Link href="/" className={navLink}>Ingatlanok</Link>
            {user && (
              <Link href="/dashboard" className={navLink}>
                <span className="inline-flex items-center gap-2"><LayoutDashboard size={15} /> Saját hirdetések</span>
              </Link>
            )}
            <Link href="/favorites" className={navLink}>
              <span className="inline-flex items-center gap-2"><Heart size={15} /> Kedvencek</span>
            </Link>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {user && (
            <span className="hidden max-w-[190px] truncate px-2 text-xs text-zinc-500 xl:block">{user.email}</span>
          )}

          {!user ? (
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-semibold text-white transition hover:border-emerald-400/30 hover:bg-white/[0.07]"
            >
              <LogIn size={16} /> Belépés
            </Link>
          ) : (
            <>
              <Link
                href="/create"
                className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-4 py-2.5 text-sm font-bold text-zinc-950 transition hover:bg-emerald-400"
              >
                <Plus size={16} /> Új hirdetés
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-medium text-zinc-300 transition hover:bg-white/[0.07] hover:text-white"
              >
                <LogOut size={16} /> Kilépés
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
