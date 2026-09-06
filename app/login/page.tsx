"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createUserWithEmailAndPassword, onAuthStateChanged, signInWithEmailAndPassword } from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { Building2, Heart, Mail, Search, ShieldCheck } from "lucide-react";

import { auth, db } from "../lib/firebase";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mode, setMode] = useState<"login" | "register">("login");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => { if (user) router.replace("/dashboard"); });
    return () => unsubscribe();
  }, [router]);

  const validate = () => {
    if (!email.trim() || !password) { setError("Add meg az e-mail-címed és a jelszavad."); return false; }
    if (password.length < 6) { setError("A jelszó legalább 6 karakter legyen."); return false; }
    setError(""); return true;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    try { setLoading(true); setError(""); await signInWithEmailAndPassword(auth, email.trim(), password); router.replace("/dashboard"); }
    catch (err) { console.error(err); setError("Sikertelen bejelentkezés. Ellenőrizd az adatokat."); }
    finally { setLoading(false); }
  };

  const handleRegister = async () => {
    if (!validate()) return;
    try {
      setLoading(true); setError("");
      const credential = await createUserWithEmailAndPassword(auth, email.trim(), password);
      await setDoc(doc(db, "users", credential.user.uid), { email: credential.user.email, role: "user", createdAt: serverTimestamp() });
      router.replace("/dashboard");
    } catch (err) { console.error(err); setError("A regisztráció nem sikerült. Lehet, hogy az e-mail már használatban van."); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-[calc(100vh-74px)] bg-[#f7f4ee] px-4 py-8 md:px-8 md:py-12">
      <div className="mx-auto grid min-h-[650px] max-w-7xl overflow-hidden rounded-[34px] border border-[#e3ddd2] bg-white shadow-[0_30px_90px_rgba(55,47,33,.10)] lg:grid-cols-[1.08fr_.92fr]">
        <section className="relative hidden overflow-hidden bg-[#f4efe5] p-12 lg:flex lg:flex-col lg:justify-between">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(185,148,69,.16),transparent_32%),radial-gradient(circle_at_80%_65%,rgba(23,107,58,.10),transparent_34%)]" />
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.22em] text-[#a1813a]"><span className="h-px w-12 bg-[#c7a95d]" /> Üdvözlünk a DebrecenHomes-on</div>
            <h1 className="mt-8 max-w-2xl text-6xl font-black leading-[.98] tracking-[-0.055em] text-[#172019]">Találd meg<br />az otthonod <span className="text-[#176b3a]">Debrecenben.</span></h1>
            <p className="mt-7 max-w-xl text-lg leading-8 text-[#657068]">Eladó és kiadó ingatlanok egyszerű kereséssel, átlátható információkkal, egy helyen.</p>
            <div className="mt-10 grid max-w-2xl grid-cols-3 gap-4">
              {[{icon:Search,title:"Gyors keresés",text:"Találd meg, amit keresel"},{icon:Heart,title:"Kedvencek",text:"Mentsd el, ami tetszik"},{icon:ShieldCheck,title:"Átlátható",text:"Fontos adatok egy helyen"}].map(({icon:Icon,title,text}) => (
                <div key={title} className="rounded-2xl bg-white/65 p-4 backdrop-blur-sm"><div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-[#f6e8bd] text-[#7e6827]"><Icon size={19}/></div><p className="font-bold text-[#263129]">{title}</p><p className="mt-1 text-xs leading-5 text-[#78827b]">{text}</p></div>
              ))}
            </div>
          </div>
          <div className="relative z-10 flex items-center gap-3 text-sm font-semibold text-[#556159]"><div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#d9c28c] bg-[#fbf6e9] text-[#a98335]"><Building2 size={20}/></div> Debrecen. Egy helyen.</div>
        </section>

        <section className="flex items-center justify-center p-5 sm:p-10 lg:p-14">
          <div className="w-full max-w-md">
            <div className="mb-8 lg:hidden"><div className="text-3xl font-black tracking-tight text-[#172019]">Debrecen<span className="text-[#176b3a]">Homes</span></div><p className="mt-2 text-[#6c776f]">Eladó és kiadó ingatlanok Debrecenben.</p></div>
            <div className="rounded-[30px] border border-[#e3ddd2] bg-white p-6 shadow-[0_18px_50px_rgba(54,46,32,.08)] sm:p-8">
              <h2 className="text-3xl font-black tracking-tight text-[#172019]">Debrecen<span className="text-[#176b3a]">Homes</span></h2>
              <p className="mt-2 text-sm text-[#737e76]">Jelentkezz be, vagy hozz létre új fiókot.</p>

              <div className="mt-7 grid grid-cols-2 rounded-2xl bg-[#f5f2ec] p-1">
                <button type="button" onClick={() => {setMode("login");setError("");}} className={`rounded-xl px-4 py-3 text-sm font-bold transition ${mode === "login" ? "bg-white text-[#176b3a] shadow-sm" : "text-[#818a84]"}`}>Belépés</button>
                <button type="button" onClick={() => {setMode("register");setError("");}} className={`rounded-xl px-4 py-3 text-sm font-bold transition ${mode === "register" ? "bg-white text-[#176b3a] shadow-sm" : "text-[#818a84]"}`}>Regisztráció</button>
              </div>

              <label className="mt-6 block text-sm font-bold text-[#3f4a43]">E-mail cím</label>
              <div className="relative mt-2"><Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-[#909991]" size={18}/><input className="dh-input rounded-2xl py-3.5 pl-11 pr-4" type="email" placeholder="nev@email.hu" value={email} onChange={(e)=>setEmail(e.target.value)} autoComplete="email" /></div>
              <label className="mt-4 block text-sm font-bold text-[#3f4a43]">Jelszó</label>
              <input className="dh-input mt-2 rounded-2xl px-4 py-3.5" type="password" placeholder="Legalább 6 karakter" value={password} onChange={(e)=>setPassword(e.target.value)} autoComplete={mode === "login" ? "current-password" : "new-password"} />

              {error && <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

              <button onClick={mode === "login" ? handleLogin : handleRegister} disabled={loading} className="mt-6 w-full rounded-2xl bg-[#176b3a] p-3.5 font-bold text-white shadow-[0_12px_28px_rgba(23,107,58,.18)] transition hover:bg-[#115b30] disabled:cursor-not-allowed disabled:opacity-60">{loading ? "Feldolgozás..." : mode === "login" ? "Belépés" : "Fiók létrehozása"}</button>
              <p className="mt-5 text-center text-xs leading-5 text-[#8a938c]">A belépéssel a DebrecenHomes felületét használod. Adataidat kizárólag a szolgáltatás működéséhez kezeljük.</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
