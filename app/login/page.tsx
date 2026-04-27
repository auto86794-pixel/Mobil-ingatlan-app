"use client";

import { useState } from "react";
import { auth } from "../lib/firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from "firebase/auth";
import { useRouter } from "next/navigation";

export default function Login() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    await signInWithEmailAndPassword(auth, email, password);
    router.push("/dashboard");
  };

  const handleRegister = async () => {
    await createUserWithEmailAndPassword(auth, email, password);
    router.push("/dashboard");
  };

  return (
    <div className="flex items-center justify-center h-screen bg-black">
      <div className="bg-gray-900 p-6 rounded-xl w-80">
        <h1 className="text-white text-xl mb-4">Bejelentkezés</h1>

        <input
          className="w-full p-2 mb-2 bg-gray-800 text-white"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          className="w-full p-2 mb-2 bg-gray-800 text-white"
          type="password"
          placeholder="Jelszó"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          onClick={handleLogin}
          className="w-full bg-blue-600 p-2 text-white mb-2"
        >
          Belépés
        </button>

        <button
          onClick={handleRegister}
          className="w-full bg-green-600 p-2 text-white"
        >
          Regisztráció
        </button>
      </div>
    </div>
  );
}