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
    <div className="bg-black/80 backdrop-blur border-b text-white">
      <div className="max-w-6xl mx-auto flex justify-between items-center p-4">

        {/* LEFT */}
        <div className="flex gap-4 items-center">
          <Link href="/" className="font-bold text-lg">
            🏠 Home
          </Link>

          {user && (
            <Link href="/dashboard" className="text-gray-300 hover:text-white">
              Dashboard
            </Link>
          )}
        </div>

        {/* RIGHT */}
        <div className="flex gap-4 items-center">

          {/* CONTACT BUTTON (MODAL) */}
          <ContactModal />

          {!user ? (
            <Link href="/login" className="text-gray-300 hover:text-white">
              Login
            </Link>
          ) : (
            <button
              onClick={handleLogout}
              className="text-red-400 hover:text-red-300"
            >
              Logout
            </button>
          )}
        </div>

      </div>
    </div>
  );
}