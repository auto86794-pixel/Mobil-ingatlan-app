import type { Metadata } from "next";
import Link from "next/link";
import "leaflet/dist/leaflet.css";
import "./globals.css";

import { Toaster } from "react-hot-toast";

import Navbar from "./components/Navbar";
import MobileBottomNav from "./components/MobileBottomNav";
import VerificationStatusBar from "./components/VerificationStatusBar";

const siteUrl = "https://debrecenhomes.hu";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "DebrecenHomes – Eladó és kiadó ingatlanok Debrecenben",
    template: "%s | DebrecenHomes",
  },
  description: "Eladó és kiadó lakások, családi házak és új építésű ingatlanok Debrecenben. Egyszerű keresés, átlátható információk, egy helyen.",
  keywords: ["Debrecen ingatlan", "eladó lakás Debrecen", "eladó ház Debrecen", "kiadó lakás Debrecen", "DebrecenHomes", "ingatlan Debrecen"],
  applicationName: "DebrecenHomes",
  authors: [{ name: "DebrecenHomes" }],
  creator: "DebrecenHomes",
  publisher: "DebrecenHomes",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website", locale: "hu_HU", url: siteUrl, siteName: "DebrecenHomes",
    title: "DebrecenHomes – Ingatlanok Debrecenben",
    description: "Eladó és kiadó ingatlanok egyszerű kereséssel, átlátható információkkal, egy helyen.",
  },
  twitter: { card: "summary_large_image", title: "DebrecenHomes – Ingatlanok Debrecenben", description: "Eladó és kiadó ingatlanok Debrecenben, egyszerű kereséssel." },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 } },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="hu">
      <body className="bg-[#f7f4ee] text-[#172019] antialiased">
        <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
        <VerificationStatusBar />
        <Navbar />
        <main>{children}</main>
        <footer className="hidden border-t border-[#e5dfd5] bg-white/70 md:block">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-7 text-xs text-[#7d877f]">
            <span>© 2026 DebrecenHomes</span>
            <div className="flex items-center gap-5"><span>Eladó és kiadó ingatlanok Debrecenben.</span><Link href="/adatvedelem" className="hover:text-[#176b3a]">Adatvédelem</Link><Link href="/impresszum" className="hover:text-[#176b3a]">Impresszum</Link></div>
          </div>
        </footer>
        <MobileBottomNav />
      </body>
    </html>
  );
}
