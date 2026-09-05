import type { Metadata } from "next";
import "leaflet/dist/leaflet.css";
import "./globals.css";

import { Toaster } from "react-hot-toast";

import Navbar from "./components/Navbar";
import MobileBottomNav from "./components/MobileBottomNav";

const siteUrl = "https://debrecenhomes.hu";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "DebrecenHomes – Eladó és kiadó ingatlanok Debrecenben",
    template: "%s | DebrecenHomes",
  },
  description:
    "Eladó és kiadó lakások, családi házak és új építésű ingatlanok Debrecenben. Keresés városrész, ár, alapterület, szobaszám és további szempontok szerint.",
  keywords: [
    "Debrecen ingatlan",
    "eladó lakás Debrecen",
    "eladó ház Debrecen",
    "kiadó lakás Debrecen",
    "DebrecenHomes",
    "ingatlan Debrecen",
  ],
  applicationName: "DebrecenHomes",
  authors: [{ name: "DebrecenHomes" }],
  creator: "DebrecenHomes",
  publisher: "DebrecenHomes",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "hu_HU",
    url: siteUrl,
    siteName: "DebrecenHomes",
    title: "DebrecenHomes – Ingatlanok Debrecenben",
    description:
      "Találd meg a megfelelő debreceni ingatlant részletes szűrőkkel és átlátható hirdetésekkel.",
  },
  twitter: {
    card: "summary_large_image",
    title: "DebrecenHomes – Ingatlanok Debrecenben",
    description:
      "Eladó és kiadó ingatlanok Debrecenben, részletes keresővel.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="hu">
      <body className="bg-zinc-950 text-white antialiased">
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
          }}
        />

        <Navbar />

        <main>{children}</main>

        <footer className="hidden border-t border-white/10 bg-zinc-950/60 md:block">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-7 text-xs text-zinc-500">
            <span>© 2026 DebrecenHomes</span>
            <span>Debreceni ingatlanok, átláthatóan.</span>
          </div>
        </footer>

        <MobileBottomNav />
      </body>
    </html>
  );
}
