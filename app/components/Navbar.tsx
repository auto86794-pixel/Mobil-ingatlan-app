"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { auth } from "../lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import ContactModal from "./ContactModal";

export default function Navbar() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsub();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    window.location.href = "/";
  };

  return (
    <div className="bg-black/80 backdrop-blur border-b border-gray-800 text-white">
      <div className="mx-auto flex items-center justify-between px-4 py-3">
        {/* LEFT */}
        <div className="flex items-center gap-4">
          <Link href="/" className="font-bold text-lg hover:text-green-400">
            🏠 Home
          </Link>

          {user && (
            <Link
              href="/dashboard"
              className="text-gray-300 hover:text-green-400"
            >
              📊 Dashboard
            </Link>
          )}
        </div>

        {/* RIGHT */}
        <div className="flex items-center gap-4">
          <ContactModal />

          {user ? (
            <>
              <span className="text-sm text-gray-300">{user.email}</span>

              <button
                onClick={handleLogout}
                className="rounded bg-red-600 px-4 py-2 text-white hover:bg-red-700"
              >
                Logout
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="rounded bg-green-600 px-4 py-2 text-white hover:bg-green-700"
            >
              Login
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}