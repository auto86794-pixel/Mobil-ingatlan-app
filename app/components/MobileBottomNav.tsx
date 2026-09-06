"use client";

import Link from "next/link";
import { onAuthStateChanged, type User } from "firebase/auth";
import { Heart, Home, LayoutDashboard, LogIn, Plus, ShieldCheck } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { auth } from "../lib/firebase";

export default function MobileBottomNav() {
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => onAuthStateChanged(auth, setUser), []);

  const navItems = user?.emailVerified
    ? [
        { href: "/properties#ingatlanok", label: "Ingatlanok", icon: Home },
        { href: "/favorites", label: "Kedvencek", icon: Heart },
        { href: "/create", label: "Hirdetés", icon: Plus },
        { href: "/dashboard", label: "Saját", icon: LayoutDashboard },
      ]
    : user
      ? [
          { href: "/properties#ingatlanok", label: "Ingatlanok", icon: Home },
          { href: "/favorites", label: "Kedvencek", icon: Heart },
          { href: "/login?verify=1", label: "Megerősítés", icon: ShieldCheck },
        ]
      : [
          { href: "/properties#ingatlanok", label: "Ingatlanok", icon: Home },
          { href: "/favorites", label: "Kedvencek", icon: Heart },
          { href: "/login", label: "Belépés", icon: LogIn },
        ];

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-[#e5dfd5] bg-white/95 px-3 pb-[max(10px,env(safe-area-inset-bottom))] pt-2 shadow-[0_-10px_35px_rgba(48,42,30,.08)] backdrop-blur-2xl md:hidden">
      <div className={`mx-auto grid max-w-md ${user?.emailVerified ? "grid-cols-4" : "grid-cols-3"} gap-1`}>
        {navItems.map((item) => {
          const active = item.href.startsWith("/properties")
            ? pathname.startsWith("/properties")
            : pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-2xl px-2 py-2 text-[11px] font-semibold transition ${
                active ? "bg-[#edf5ef] text-[#176b3a]" : "text-[#7c877f]"
              }`}
            >
              <Icon size={20} strokeWidth={active ? 2.2 : 1.8} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
