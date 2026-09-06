"use client";

import Link from "next/link";
import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import { Building2, Heart, LayoutDashboard, LogIn, LogOut, Plus, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";

import { auth } from "../lib/firebase";

const navLink =
  "rounded-full px-4 py-2 text-sm font-semibold text-[#3f4a43] transition hover:bg-[#f3efe7] hover:text-[#176b3a]";

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
    <nav className="sticky top-0 z-50 hidden border-b border-[#e7e1d7] bg-white/92 backdrop-blur-2xl md:block">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3.5">
        <div className="flex items-center gap-8">
          <Link href="/" className="group flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[#d9c28c] bg-[#fbf6e9] text-[#a98335] transition group-hover:bg-[#f5ecd7]">
              <Building2 size={22} strokeWidth={1.8} />
            </div>
            <div>
              <div className="text-base font-black tracking-tight text-[#172019]">
                Debrecen<span className="text-[#176b3a]">Homes</span>
              </div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8b938c]">Debreceni ingatlanok</div>
            </div>
          </Link>

          <div className="flex items-center gap-1">
            <Link href="/" className={navLink}>Ingatlanok</Link>
            <Link href="/favorites" className={navLink}>
              <span className="inline-flex items-center gap-2"><Heart size={15} /> Kedvencek</span>
            </Link>
            {user?.emailVerified && (
              <Link href="/dashboard" className={navLink}>
                <span className="inline-flex items-center gap-2"><LayoutDashboard size={15} /> Saját hirdetések</span>
              </Link>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {user && (
            <span className="hidden max-w-[190px] truncate px-2 text-xs text-[#8b938c] xl:block">{user.email}</span>
          )}

          {!user ? (
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-2xl bg-[#176b3a] px-5 py-2.5 text-sm font-bold text-white shadow-[0_10px_25px_rgba(23,107,58,.16)] transition hover:bg-[#115b30]"
            >
              <LogIn size={16} /> Belépés
            </Link>
          ) : (
            <>
              {user.emailVerified ? (
                <Link
                  href="/create"
                  className="inline-flex items-center gap-2 rounded-2xl border border-[#b9d1c0] bg-[#f3f8f4] px-4 py-2.5 text-sm font-bold text-[#176b3a] transition hover:bg-[#e9f3ec]"
                >
                  <Plus size={16} /> Új hirdetés
                </Link>
              ) : (
                <Link
                  href="/login?verify=1"
                  className="inline-flex items-center gap-2 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-2.5 text-sm font-bold text-amber-900 transition hover:bg-amber-100"
                >
                  <ShieldCheck size={16} /> Megerősítés
                </Link>
              )}
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center gap-2 rounded-2xl border border-[#ded8ce] bg-white px-4 py-2.5 text-sm font-semibold text-[#4e5a52] transition hover:bg-[#f7f4ee]"
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
