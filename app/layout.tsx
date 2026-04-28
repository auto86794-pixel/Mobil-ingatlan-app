import "./globals.css";
import { Toaster } from "react-hot-toast";
import Navbar from "./components/Navbar";

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
      <body>
        {/* TOAST */}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
          }}
        />

        {/* NAVBAR */}
        <Navbar />

        {/* APP */}
        {children}
      </body>
    </html>
  );
}