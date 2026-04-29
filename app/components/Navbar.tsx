"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { auth } from "../lib/firebase";

import {
  onAuthStateChanged,
  signOut,
  User,
} from "firebase/auth";

export default function Navbar() {
  const [user, setUser] =
    useState<User | null>(null);

  useEffect(() => {
    const unsubscribe =
      onAuthStateChanged(auth, (currentUser) => {
        setUser(currentUser);
      });

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <nav
      className="
        z-50
        border-b
        border-zinc-800
        bg-zinc-900/95
        backdrop-blur-xl
      "
    >
      <div
        className="
          mx-auto
          flex
          max-w-7xl
          items-center
          justify-between
          px-4
          py-4
        "
      >

        {/* LEFT */}
        <div
          className="
            flex
            items-center
            gap-4
            md:gap-8
          "
        >

          {/* LOGO */}
          <Link
            href="/"
            className="
              flex
              items-center
              gap-3
            "
          >

            <div
              className="
                flex
                h-12
                w-12
                items-center
                justify-center
                rounded-2xl
                bg-emerald-500
                text-2xl
              "
            >
              🏠
            </div>

            {/* LOGO TEXT */}
            <div className="hidden lg:block">

              <h1
                className="
                  text-lg
                  font-black
                  text-white
                "
              >
                Debrecen Homes
              </h1>

              <p
                className="
                  text-xs
                  text-zinc-400
                "
              >
                Premium Real Estate
              </p>

            </div>

          </Link>

          {/* MENU */}
          <div
            className="
              flex
              items-center
              gap-4
              text-sm
              md:gap-8
            "
          >

            {/* HOME - ONLY DESKTOP */}
            <Link
              href="/"
              className="
                hidden
                md:block
                text-zinc-300
                transition
                hover:text-emerald-400
              "
            >
              Főoldal
            </Link>

            {/* DASHBOARD */}
            <Link
              href="/dashboard"
              className="
                text-zinc-300
                transition
                hover:text-emerald-400
              "
            >
              Dashboard
            </Link>

            {/* FAVORITES - ONLY DESKTOP */}
            <Link
              href="/favorites"
              className="
                hidden
                md:block
                text-zinc-300
                transition
                hover:text-emerald-400
              "
            >
              Kedvencek
            </Link>

          </div>

        </div>

        {/* RIGHT SIDE */}
        <div
          className="
            flex
            items-center
            gap-2
          "
        >

          {/* USER EMAIL - ONLY LARGE DESKTOP */}
          {user && (
            <div
              className="
                hidden
                xl:block
                max-w-[180px]
                truncate
                text-sm
                text-zinc-400
              "
            >
              {user.email}
            </div>
          )}

          {/* LOGIN */}
          {!user && (
            <Link href="/login">

              <button
                className="
                  rounded-full
                  border
                  border-zinc-700
                  bg-zinc-900
                  px-3
                  py-2
                  text-sm
                  text-white
                  transition
                  hover:border-emerald-500
                "
              >
                Belépés
              </button>

            </Link>
          )}

          {/* CREATE */}
          <Link href="/create">

            <button
              className="
                rounded-full
                bg-emerald-500
                px-3
                py-2
                text-sm
                font-semibold
                text-white
                transition
                hover:bg-emerald-400
              "
            >
              Hirdetés
            </button>

          </Link>

          {/* LOGOUT */}
          {user && (
            <button
              onClick={handleLogout}
              className="
                rounded-full
                bg-red-500
                px-3
                py-2
                text-sm
                text-white
                transition
                hover:bg-red-400
              "
            >
              Kilépés
            </button>
          )}

        </div>

      </div>
    </nav>
  );
}