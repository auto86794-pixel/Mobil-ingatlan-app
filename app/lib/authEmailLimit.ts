import { createHash } from "node:crypto";
import { adminDb } from "./managementServer";
// Shared between server instances; clients cannot access this collection.
export async function reserveAuthEmail(email: string, ip: string, purpose: string) {
  const db = adminDb();
  const now = Date.now();
  const keys = [
    { key: `${purpose}:email:${email}`, window: 60_000, limit: 1 },
    { key: `${purpose}:ip:${ip}`, window: 600_000, limit: 10 },
  ];
  const refs = keys.map(({ key }) => db.collection("authRateLimits").doc(createHash("sha256").update(key).digest("hex")));
  return db.runTransaction(async (tx) => {
    const snapshots = await tx.getAll(...refs);
    const states = snapshots.map((snapshot, index) => {
      const data = snapshot.data();
      const start = typeof data?.start === "number" ? data.start : 0;
      const count = typeof data?.count === "number" ? data.count : 0;
      return now - start >= keys[index].window ? { start: now, count: 0 } : { start, count };
    });
    if (states.some((state, index) => state.count >= keys[index].limit)) return false;
    states.forEach((state, index) => tx.set(refs[index], { start: state.start, count: state.count + 1 }));
    return true;
  });
}
