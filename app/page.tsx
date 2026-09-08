import { collection, getDocs, query, where } from "firebase/firestore";

import HomeClient from "./HomeClient";
import { db } from "./lib/firebase";
import { propertyFromFirestore, type PropertyWithId } from "./lib/types";

export const revalidate = 60;

function makeSerializable(property: PropertyWithId): PropertyWithId {
  const timestampValue = (value: unknown) => {
    if (value && typeof value === "object" && "toMillis" in value) {
      const toMillis = (value as { toMillis?: () => number }).toMillis;
      if (typeof toMillis === "function") return toMillis.call(value);
    }
    return value instanceof Date ? value.getTime() : null;
  };

  return { ...property, createdAt: timestampValue(property.createdAt), updatedAt: timestampValue(property.updatedAt) };
}

export default async function HomePage() {
  let posts: PropertyWithId[] = [];
  try {
    const snapshot = await getDocs(query(collection(db, "posts"), where("status", "==", "active")));
    posts = snapshot.docs.map((item) => makeSerializable(propertyFromFirestore(item.id, item.data() as Record<string, unknown>)));
  } catch (error) {
    console.error("Aktív ingatlanok szerveroldali betöltési hibája:", error);
  }
  return <HomeClient initialPosts={posts} />;
}
