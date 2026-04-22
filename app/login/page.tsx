'use client';

import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    // 🔥 VALIDÁCIÓ
    if (!email || !password) {
      alert('Töltsd ki az email és jelszó mezőt!');
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      alert(error.message);
      return;
    }

    // 🔥 SIKER → vissza főoldal
    router.push('/');
    router.refresh();
  };

  const handleRegister = async () => {
    // 🔥 VALIDÁCIÓ
    if (!email || !password) {
      alert('Töltsd ki az email és jelszó mezőt!');
      return;
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      alert(error.message);
      return;
    }

    alert('Regisztráció sikeres! Most jelentkezz be.');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 text-white">
      <div className="bg-gray-900 p-6 rounded-xl w-80">

        <h2 className="text-xl mb-4 text-center">Login</h2>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e)=>setEmail(e.target.value)}
          className="w-full p-2 mb-2 bg-gray-800 rounded"
        />

        <input
          type="password"
          placeholder="Jelszó"
          value={password}
          onChange={(e)=>setPassword(e.target.value)}
          className="w-full p-2 mb-4 bg-gray-800 rounded"
        />

        <button
          onClick={handleLogin}
          className="w-full bg-blue-600 py-2 mb-2 rounded"
        >
          Belépés
        </button>

        <button
          onClick={handleRegister}
          className="w-full bg-green-600 py-2 rounded"
        >
          Regisztráció
        </button>

      </div>
    </div>
  );
}