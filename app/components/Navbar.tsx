"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { auth } from "../lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";

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
    <div className="bg-black/80 backdrop-blur border-b border-gray-800 px-6 py-3 flex justify-between items-center text-white">

      {/* LEFT */}
      <div className="flex gap-4 items-center">
        <Link href="/" className="font-bold text-lg">
          🏠 Home
        </Link>

        {user && (
          <Link href="/dashboard" className="text-gray-300 hover:text-white">
            📊 Dashboard
          </Link>
        )}
      </div>

      {/* RIGHT */}
      <div className="flex items-center gap-3">
        {!user ? (
          <Link
            href="/login"
            className="bg-green-600 px-3 py-1 rounded hover:bg-green-700"
          >
            Login
          </Link>
        ) : (
          <>
            <span className="text-gray-400 text-sm">
              {user.email}
            </span>

            <button
              onClick={handleLogout}
              className="bg-red-600 px-3 py-1 rounded hover:bg-red-700"
            >
              Logout
            </button>
          </>
        )}
      </div>
    </div>
  );
}