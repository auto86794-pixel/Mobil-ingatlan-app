"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";

import { auth, db } from "../lib/firebase";

export default function Login() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) router.replace("/dashboard");
    });

    return () => unsubscribe();
  }, [router]);

  const validate = () => {
    if (!email.trim() || !password) {
      setError("Add meg az e-mail-címed és a jelszavad.");
      return false;
    }

    if (password.length < 6) {
      setError("A jelszó legalább 6 karakter legyen.");
      return false;
    }

    setError("");
    return true;
  };

  const handleLogin = async () => {
    if (!validate()) return;

    try {
      setLoading(true);
      setError("");
      await signInWithEmailAndPassword(auth, email.trim(), password);
      router.replace("/dashboard");
    } catch (err) {
      console.error(err);
      setError("Sikertelen bejelentkezés. Ellenőrizd az adatokat.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!validate()) return;

    try {
      setLoading(true);
      setError("");

      const credential = await createUserWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );

      await setDoc(doc(db, "users", credential.user.uid), {
        email: credential.user.email,
        role: "user",
        createdAt: serverTimestamp(),
      });

      router.replace("/dashboard");
    } catch (err) {
      console.error(err);
      setError("A regisztráció nem sikerült. Lehet, hogy az e-mail már használatban van.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-black p-6">
      <div className="w-full max-w-sm rounded-3xl border border-zinc-800 bg-zinc-900 p-7 shadow-2xl">
        <h1 className="text-2xl font-black text-white">Debrecen Homes</h1>
        <p className="mb-6 mt-2 text-sm text-zinc-400">
          Jelentkezz be, vagy hozz létre új fiókot.
        </p>

        <input
          className="mb-3 w-full rounded-xl border border-zinc-700 bg-zinc-800 p-3 text-white outline-none focus:border-emerald-500"
          type="email"
          placeholder="E-mail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
        />

        <input
          className="mb-3 w-full rounded-xl border border-zinc-700 bg-zinc-800 p-3 text-white outline-none focus:border-emerald-500"
          type="password"
          placeholder="Jelszó"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
        />

        {error && (
          <div className="mb-3 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300">
            {error}
          </div>
        )}

        <button
          onClick={handleLogin}
          disabled={loading}
          className="mb-2 w-full rounded-xl bg-emerald-600 p-3 font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Feldolgozás..." : "Belépés"}
        </button>

        <button
          onClick={handleRegister}
          disabled={loading}
          className="w-full rounded-xl border border-zinc-700 bg-zinc-800 p-3 font-semibold text-white transition hover:border-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Regisztráció
        </button>
      </div>
    </div>
  );
}
