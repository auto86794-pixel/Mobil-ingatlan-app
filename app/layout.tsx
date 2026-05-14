import "leaflet/dist/leaflet.css";
import "./globals.css";

import { Toaster } from "react-hot-toast";

import Navbar from "./components/Navbar";
import MobileBottomNav from "./components/MobileBottomNav";

export const metadata = {
  title: "Debrecen Homes",
  description: "Marketplace application",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="hu">
      <body className="bg-black text-white">
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
          }}
        />

        <Navbar />

        <main>{children}</main>

        <MobileBottomNav />
      </body>
    </html>
  );
}