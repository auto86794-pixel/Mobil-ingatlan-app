import "./globals.css";
import Navbar from "./components/Navbar";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="hu">
      <body className="bg-gray-950 text-white">
        <Navbar />
        {children}
      </body>
    </html>
  );
}