import { knownDate } from "./lib/propertySeo";
import type { MetadataRoute } from "next";
import { collection, getDocs, query, where } from "firebase/firestore";

import { db } from "./lib/firebase";
import { propertyFromFirestore } from "./lib/types";

import { SITE_URL } from "@/app/lib/site";

// Az aktív ingatlanok változhatnak deploy nélkül is, ezért a sitemap minden
// lekéréskor a Firestore aktuális állapotából készül.
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const routes: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${SITE_URL}/properties`,
      changeFrequency: "daily",
      priority: 0.95,
    },
    { url: `${SITE_URL}/adatvedelem`, lastModified: new Date("2026-10-04"), changeFrequency: "yearly", priority: 0.2 },
  ];

  try {
    const snapshot = await getDocs(query(collection(db, "posts"), where("status", "==", "active")));
    const properties = snapshot.docs
      .map((item) => propertyFromFirestore(item.id, item.data()))
      .filter((property) => property.status === "active");

    for (const property of properties) {
      routes.push({
        url: `${SITE_URL}/post/${property.id}`,
        lastModified: knownDate(property.updatedAt) ?? knownDate(property.createdAt),
        changeFrequency: "weekly",
        priority: property.featured ? 0.9 : 0.8,
      });
    }
  } catch (error) {
    console.error("Sitemap generation error:", error);
  }

  return routes;
}
