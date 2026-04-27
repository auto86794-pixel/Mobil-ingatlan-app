import "./globals.css";
import Navbar from "./components/Navbar";
import { Toaster } from "react-hot-toast";

export const metadata = {
  title: "Albi App",
  description: "Ingatlan kereső alkalmazás",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="hu">
      <body className="bg-gray-950 text-white">

        <Navbar />

        <main>{children}</main>

        {/* 🔥 TOAST */}
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: "#1f2937",
              color: "#fff",
              borderRadius: "10px",
            },
          }}
        />

      </body>
    </html>
  );
}