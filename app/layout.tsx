import "./globals.css";
import Navbar from "./components/Navbar";

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
        
        {/* 🔥 NAVBAR */}
        <Navbar />

        {/* 🔥 OLDAL TARTALOM */}
        <main>{children}</main>

      </body>
    </html>
  );
}