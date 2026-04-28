import "./globals.css";
import { Toaster } from "react-hot-toast";

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

        {/* APP */}
        {children}
      </body>
    </html>
  );
}