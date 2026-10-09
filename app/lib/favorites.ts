import { collection, doc, getDocs, query, where, writeBatch } from "firebase/firestore";
import { db } from "./firebase";

export async function setFavorite(userId: string, postId: string, wanted: boolean) {
  const snapshot = await getDocs(query(collection(db, "favorites"), where("userId", "==", userId), where("postId", "==", postId)));
  const canonical = doc(db, "favorites", `${encodeURIComponent(userId)}:${encodeURIComponent(postId)}`);
  const batch = writeBatch(db);
  for (const item of snapshot.docs) {
    if (!wanted || item.id !== canonical.id) batch.delete(item.ref);
  }
  if (wanted) batch.set(canonical, { userId, postId });
  else batch.delete(canonical);
  await batch.commit();
}
