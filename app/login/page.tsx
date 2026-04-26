'use client';

import { useState } from 'react';
import { auth } from '../lib/firebase';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from 'firebase/auth';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const login = async () => {
    try {
      setLoading(true);
      await signInWithEmailAndPassword(auth, email, password);
      alert('Sikeres bejelentkezés!');
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const register = async () => {
    try {
      setLoading(true);
      await createUserWithEmailAndPassword(auth, email, password);
      alert('Sikeres regisztráció!');
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-gray-900 p-6 rounded-2xl border border-gray-800 shadow-xl">
        <h1 className="text-2xl font-bold mb-6">🔐 Bejelentkezés</h1>

        <input
          type="email"
          placeholder="Email cím"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-3 mb-3 rounded bg-gray-800 border border-gray-700"
        />

        <input
          type="password"
          placeholder="Jelszó"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-3 mb-4 rounded bg-gray-800 border border-gray-700"
        />

        <button
          onClick={login}
          disabled={loading}
          className="w-full bg-blue-600 py-3 rounded mb-3 disabled:opacity-50"
        >
          {loading ? 'Betöltés...' : 'Belépés'}
        </button>

        <button
          onClick={register}
          disabled={loading}
          className="w-full bg-green-600 py-3 rounded disabled:opacity-50"
        >
          Regisztráció
        </button>
      </div>
    </div>
  );
}