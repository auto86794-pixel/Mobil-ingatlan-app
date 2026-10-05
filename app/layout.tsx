import type { Metadata } from "next";
import Link from "next/link";
import "leaflet/dist/leaflet.css";
import "./globals.css";

import { Toaster } from "react-hot-toast";

import Navbar from "./components/Navbar";
import MobileBottomNav from "./components/MobileBottomNav";
import VerificationStatusBar from "./components/VerificationStatusBar";

import { SITE_URL as siteUrl } from "@/app/lib/site";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Debreceni Otthonok – Eladó és kiadó ingatlanok Debrecenben",
    template: "%s | Debreceni Otthonok",
  },
  description: "Eladó és kiadó lakások, családi házak és új építésű ingatlanok Debrecenben. Egyszerű keresés, átlátható információk, egy helyen.",
  keywords: ["Debrecen ingatlan", "eladó lakás Debrecen", "eladó ház Debrecen", "kiadó lakás Debrecen", "Debreceni Otthonok", "ingatlan Debrecen"],
  applicationName: "Debreceni Otthonok",
  authors: [{ name: "Debreceni Otthonok" }],
  creator: "Debreceni Otthonok",
  publisher: "Debreceni Otthonok",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website", locale: "hu_HU", url: siteUrl, siteName: "Debreceni Otthonok",
    title: "Debreceni Otthonok – Ingatlanok Debrecenben",
    description: "Eladó és kiadó ingatlanok egyszerű kereséssel, átlátható információkkal, egy helyen.",
  },
  twitter: { card: "summary_large_image", title: "Debreceni Otthonok – Ingatlanok Debrecenben", description: "Eladó és kiadó ingatlanok Debrecenben, egyszerű kereséssel." },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 } },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="hu">
      <body className="bg-[#f7f4ee] text-[#172019] antialiased">
        <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
        <VerificationStatusBar />
        <Navbar />
        <div>{children}</div>
        <footer className="border-t border-[#e5dfd5] bg-white/70">
          <div className="mx-auto flex max-w-7xl flex-col gap-4 items-center justify-between px-6 py-7 text-sm lg:flex-row text-[#7d877f]">
            <span>© {new Date().getFullYear()} Debreceni Otthonok</span>
            <div className="flex flex-wrap justify-center items-center gap-5"><span>Eladó és kiadó ingatlanok Debrecenben.</span><Link href="/adatvedelem" className="hover:text-[#176b3a]">Adatvédelem</Link><Link href="/impresszum" className="hover:text-[#176b3a]">Impresszum</Link></div>
          </div>
        </footer>
        <MobileBottomNav />
      </body>
    </html>
  );
}
