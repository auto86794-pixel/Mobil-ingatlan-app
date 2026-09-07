import { collection, getDocs, query, where } from "firebase/firestore";
import { unstable_cache } from "next/cache";

import HomeClient from "./HomeClient";
import { db } from "./lib/firebase";
import { propertyFromFirestore, type PropertyWithId } from "./lib/types";

const getActiveProperties = unstable_cache(
  async (): Promise<PropertyWithId[]> => {
    const snapshot = await getDocs(
      query(collection(db, "posts"), where("status", "==", "active"))
    );

    return snapshot.docs
      .map((item) =>
        propertyFromFirestore(item.id, item.data() as Record<string, unknown>)
      )
      .filter((property) => property.status === "active")
      .map((property) => ({
        ...property,
        createdAt:
          property.createdAt &&
          typeof property.createdAt === "object" &&
          "toMillis" in property.createdAt &&
          typeof (property.createdAt as { toMillis?: unknown }).toMillis === "function"
            ? (property.createdAt as { toMillis: () => number }).toMillis()
            : undefined,
        updatedAt: undefined,
      }));
  },
  ["debrecenhomes-active-properties"],
  { revalidate: 300 }
);

export default async function HomePage() {
  const initialPosts = await getActiveProperties();
  return <HomeClient initialPosts={initialPosts} />;
}
