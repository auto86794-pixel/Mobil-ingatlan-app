"use client";

import Link from "next/link";
import { onAuthStateChanged, type User } from "firebase/auth";
import { AlertTriangle, ArrowRight } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { auth } from "../lib/firebase";

export default function VerificationStatusBar() {
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => onAuthStateChanged(auth, setUser), []);

  if (!user || user.emailVerified || pathname === "/login") return null;

  return (
    <div className="border-b border-amber-200 bg-amber-50 px-4 py-2.5 text-amber-950">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2 text-xs font-semibold sm:text-sm">
          <AlertTriangle size={16} className="shrink-0 text-amber-700" />
          <span className="truncate">Az e-mail címed még nincs megerősítve.</span>
        </div>
        <Link href="/login?verify=1" className="inline-flex shrink-0 items-center gap-1 text-xs font-black text-[#176b3a] hover:underline sm:text-sm">
          Megerősítés <ArrowRight size={14} />
        </Link>
      </div>
    </div>
  );
}
