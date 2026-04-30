"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { auth, db } from "../lib/firebase";

import { onAuthStateChanged } from "firebase/auth";

import {
  doc,
  getDoc,
} from "firebase/firestore";

export default function AdminPage() {
  const router = useRouter();

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    const unsubscribe =
      onAuthStateChanged(
        auth,
        async (user) => {

          // NINCS LOGIN
          if (!user) {
            router.push("/login");
            return;
          }

          try {
            const userRef = doc(
              db,
              "users",
              user.uid
            );

            const snapshot =
              await getDoc(userRef);

            // NINCS USER DOC
            if (!snapshot.exists()) {
              router.push("/");
              return;
            }

            const userData =
              snapshot.data();

            // NEM ADMIN
            if (
              userData.role !== "admin"
            ) {
              router.push("/");
              return;
            }

            setLoading(false);

          } catch (error) {
            console.error(error);
            router.push("/");
          }
        }
      );

    return () => unsubscribe();
  }, [router]);

  // LOADING
  if (loading) {
    return (
      <div
        className="
          flex
          min-h-screen
          items-center
          justify-center
          bg-black
          text-white
        "
      >
        Admin betöltése...
      </div>
    );
  }

  return (
    <main
      className="
        min-h-screen
        bg-black
        px-6
        py-10
        text-white
      "
    >

      <div className="mx-auto max-w-7xl">

        {/* HEADER */}
        <div className="mb-10">

          <h1
            className="
              text-4xl
              font-black
              tracking-tight
            "
          >
            🛡️ Admin Dashboard
          </h1>

          <p className="mt-3 text-zinc-400">
            Platform moderáció és kezelőfelület.
          </p>

        </div>

        {/* STATS */}
        <div
          className="
            grid
            gap-6
            md:grid-cols-3
          "
        >

          {/* USERS */}
          <div
            className="
              rounded-3xl
              border
              border-zinc-800
              bg-zinc-900
              p-6
            "
          >

            <p className="text-zinc-400">
              Összes felhasználó
            </p>

            <h2
              className="
                mt-3
                text-4xl
                font-black
                text-emerald-400
              "
            >
              0
            </h2>

          </div>

          {/* POSTS */}
          <div
            className="
              rounded-3xl
              border
              border-zinc-800
              bg-zinc-900
              p-6
            "
          >

            <p className="text-zinc-400">
              Aktív hirdetések
            </p>

            <h2
              className="
                mt-3
                text-4xl
                font-black
                text-emerald-400
              "
            >
              0
            </h2>

          </div>

          {/* APPROVALS */}
          <div
            className="
              rounded-3xl
              border
              border-zinc-800
              bg-zinc-900
              p-6
            "
          >

            <p className="text-zinc-400">
              Függő jóváhagyások
            </p>

            <h2
              className="
                mt-3
                text-4xl
                font-black
                text-yellow-400
              "
            >
              0
            </h2>

          </div>

        </div>

      </div>

    </main>
  );
}