"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { signOut } from "firebase/auth";
import { Building2, Heart, LayoutDashboard, LogIn, LogOut, Menu, Plus, ShieldCheck, X } from "lucide-react";
import { usePathname } from "next/navigation";
import toast from "react-hot-toast";
import { auth } from "../lib/firebase";
import { useAccount } from "../lib/useAccount";

export default function Navbar() {
  const pathname = usePathname();
  const { user, isAdmin } = useAccount();
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => { setOpen(false); }, [pathname]);
  useEffect(() => {
    if (!open) return;
    const panel = dialog.current;
    if (!panel) return;
    panel.showModal();
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { panel.close(); document.body.style.overflow = previous; };
  }, [open]);
  const logout = async () => {
    setLoggingOut(true);
    try { await signOut(auth); setOpen(false); }
    catch { toast.error("A kijelentkezés nem sikerült. Próbáld újra."); }
    finally { setLoggingOut(false); }
  };
  const links = [
    { href: "/#ingatlanok", label: "Keresés", icon: Building2 },
    { href: "/properties?purpose=sale#results", label: "Eladó ingatlanok", icon: Building2 },
    { href: "/properties?purpose=rent#results", label: "Kiadó ingatlanok", icon: Building2 },
    { href: "/favorites", label: "Kedvencek", icon: Heart },
    ...(isAdmin ? [{ href: "/admin", label: "Összes ingatlan kezelése", icon: ShieldCheck }] : []),
    ...(user?.emailVerified ? [{ href: "/dashboard", label: "Saját hirdetések", icon: LayoutDashboard }] : []),
  ];
  const active = (href: string) => pathname === href.split("#")[0] || pathname.startsWith(href.split("#")[0] + "/");
  const actions = <>
    {!user && <Link href="/create" onClick={() => setOpen(false)} className="dh-nav-action do-post-action"><Plus size={17} /> Hirdetésfeladás</Link>}
    {!user ? <Link href="/login" onClick={() => setOpen(false)} className="dh-nav-action bg-[#008000] text-white"><LogIn size={18} /> Belépés</Link> : <>
      <Link href={user.emailVerified ? "/create" : "/login?verify=1"} onClick={() => setOpen(false)} className="dh-nav-action border border-[#b9d1c0] text-[#176b3a]">{user.emailVerified ? <Plus size={18} /> : <ShieldCheck size={18} />}{user.emailVerified ? "Új hirdetés" : "E-mail megerősítése"}</Link>
      <button type="button" disabled={loggingOut} onClick={() => void logout()} className="dh-nav-action border border-[#ded8ce] disabled:opacity-50"><LogOut size={18} />{loggingOut ? "Kilépés…" : "Kilépés"}</button>
    </>}
  </>;
  return <>
    <header className="sticky top-0 z-50 border-b border-[#e7e1d7] bg-white/95 backdrop-blur-xl">
      <div className="do-header-inner mx-auto flex max-w-[1440px] items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <Link href="/" aria-label="Debreceni Otthonok kezdőlap" className="flex shrink-0 items-center gap-2">
          <span className="do-brand-mark" aria-hidden="true"><svg viewBox="0 0 64 64" fill="none"><path d="M52 10C39-2 15 3 6 20C-4 41 13 63 35 62C48 61 57 53 61 42C51 58 33 62 19 53C2 42 6 18 21 9C31 3 44 4 52 10Z" fill="#B8862D"/><path d="M14 30L33 14L54 32V37L33 20L19 32V52H14V30Z" fill="#183D32"/><path d="M27 54V47a7 7 0 0 1 14 0v7H27Z" fill="#183D32"/><path d="M28 27h5v5h-5zm7 0h5v5h-5zm-7 7h5v5h-5zm7 0h5v5h-5z" fill="#B8862D"/></svg></span>
          <span className="do-brand"><span className="do-brand-name">Debreceni<br /><span>Otthonok</span></span><span className="do-brand-caption">Ingatlanok Debrecenben</span></span>
        </Link>
        <nav aria-label="Főmenü" className="hidden items-center gap-1 xl:flex">
          {links.map(item => <Link key={item.href} href={item.href} aria-current={active(item.href) ? "page" : undefined} className={"rounded-full px-3 py-3 text-sm font-semibold " + (active(item.href) ? "bg-[#edf5ef] text-[#176b3a]" : "hover:bg-[#f3efe7]")}>{item.href === "/admin" ? "Admin" : item.label}</Link>)}
          <details className="do-nav-dropdown"><summary>Városrészek</summary><div>{["Belváros", "Nagyerdő", "Józsa", "Tócóskert", "Pallag"].map(district => <Link key={district} href={`/properties?district=${encodeURIComponent(district)}#results`}>{district}</Link>)}</div></details>
          <details className="do-nav-dropdown"><summary>Információk</summary><div><Link href="/#debrecen">Miért Debrecen?</Link><Link href="/adatvedelem">Adatvédelem</Link><Link href="/impresszum">Kapcsolat</Link></div></details>
        </nav>
        <div className="hidden shrink-0 gap-2 xl:flex">{actions}</div>
        <button type="button" aria-haspopup="dialog" aria-expanded={open} aria-controls="mobile-menu" onClick={() => setOpen(true)} className="flex min-h-11 items-center gap-2 rounded-xl border border-[#ded8ce] px-3 font-semibold xl:hidden"><Menu size={20} />Menü</button>
      </div>
    </header>
    <dialog ref={dialog} id="mobile-menu" aria-labelledby="menu-title" onCancel={() => setOpen(false)} onClose={() => setOpen(false)} onClick={e => { if (e.target === e.currentTarget) setOpen(false); }} className="fixed inset-x-0 top-0 m-0 max-h-[100dvh] w-full max-w-none overflow-y-auto rounded-b-3xl bg-white p-0 text-[#172019] shadow-2xl backdrop:bg-black/40">
      <div className="mx-auto max-w-xl p-4 sm:p-6">
        <div className="flex items-center justify-between gap-3"><h2 id="menu-title" className="text-xl font-black">Menü</h2><button type="button" autoFocus aria-label="Menü bezárása" onClick={() => setOpen(false)} className="flex h-11 w-11 items-center justify-center rounded-xl border"><X size={22} /></button></div>
        {user && <p className="mt-3 break-all rounded-xl bg-[#f7f4ee] p-3 text-sm">{user.email}<span className="mt-1 block text-[#69736c]">{isAdmin ? "Adminisztrátor" : "Bejelentkezve"}</span></p>}
        <nav aria-label="Mobil főmenü" className="my-4 space-y-1">{links.map(item => <Link key={item.href} href={item.href} onClick={() => setOpen(false)} aria-current={active(item.href) ? "page" : undefined} className={"flex min-h-12 items-center gap-3 rounded-xl px-3 py-3 font-semibold " + (active(item.href) ? "bg-[#edf5ef] text-[#176b3a]" : "hover:bg-[#f7f4ee]")}><item.icon size={20} />{item.label}</Link>)}</nav>
        <div className="flex flex-wrap gap-2 border-t pt-4">{actions}</div>
        <div className="mt-4 flex flex-wrap gap-4 text-sm text-[#69736c]"><Link href="/adatvedelem" onClick={() => setOpen(false)} className="py-3">Adatvédelem</Link><Link href="/impresszum" onClick={() => setOpen(false)} className="py-3">Impresszum</Link></div>
      </div>
    </dialog>
  </>;
}
