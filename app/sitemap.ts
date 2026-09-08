import type { MetadataRoute } from "next";
import { collection, getDocs, query, where } from "firebase/firestore";

import { db } from "./lib/firebase";
import { propertyFromFirestore } from "./lib/types";

const SITE_URL = "https://debrecenhomes.hu";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const routes: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${SITE_URL}/properties`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.95,
    },
    { url: `${SITE_URL}/adatvedelem`, lastModified: new Date("2026-09-07"), changeFrequency: "yearly", priority: 0.2 },
    { url: `${SITE_URL}/impresszum`, lastModified: new Date("2026-09-07"), changeFrequency: "yearly", priority: 0.2 },
  ];

  try {
    const snapshot = await getDocs(query(collection(db, "posts"), where("status", "==", "active")));
    const properties = snapshot.docs
      .map((item) => propertyFromFirestore(item.id, item.data()))
      .filter((property) => property.status === "active");

    for (const property of properties) {
      routes.push({
        url: `${SITE_URL}/post/${property.id}`,
        lastModified:
          property.updatedAt && typeof property.updatedAt === "object" && "toDate" in property.updatedAt
            ? (property.updatedAt as { toDate: () => Date }).toDate()
            : new Date(),
        changeFrequency: "weekly",
        priority: property.featured ? 0.9 : 0.8,
      });
    }
  } catch (error) {
    console.error("Sitemap generation error:", error);
  }

  return routes;
}
