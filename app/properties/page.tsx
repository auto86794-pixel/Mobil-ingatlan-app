import HomePage from "../page";

export const metadata = {
  title: "Ingatlanok Debrecenben",
  description: "Eladó és kiadó ingatlanok Debrecenben kereséssel és részletes szűrőkkel.",
  alternates: { canonical: "/properties" },
  openGraph: {
    url: "/properties",
    title: "Ingatlanok Debrecenben | DebrecenHomes",
    description: "Eladó és kiadó ingatlanok Debrecenben kereséssel és részletes szűrőkkel.",
  },
};

export default function PropertiesPage() {
  return <HomePage />;
}
