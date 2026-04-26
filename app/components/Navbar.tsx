"use client";

import { auth } from "../lib/firebase";
import { signOut } from "firebase/auth";

export default function Navbar() {
  const handleLogout = async () => {
    await signOut(auth);
    window.location.href = "/login";
  };

  return (
    <div className="w-full bg-gray-900 border-b border-gray-800 px-6 py-4 flex justify-between items-center">
      <h1 className="text-xl font-bold text-white">🏠 Ingatlan App</h1>

      <div className="flex gap-4">
        <a href="/" className="text-gray-300 hover:text-white">
          Főoldal
        </a>

        <a href="/dashboard" className="text-gray-300 hover:text-white">
          Dashboard
        </a>

        <button
          onClick={handleLogout}
          className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded-lg text-white"
        >
          Kilépés
        </button>
      </div>
    </div>
  );
}