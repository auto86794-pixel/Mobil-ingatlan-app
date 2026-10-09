import { cleanSearchCriteria } from "./searchCriteria";
import { createHash, randomUUID } from "node:crypto";
import { adminDb, stamp } from "./managementServer";
export async function captureInquiry(
  body: Record<string, string>,
  submissionId: unknown,
  ip: string,
  uniqueKey?: string,
) {
  if (uniqueKey) {
    const legacy = await adminDb().collection("searchAlerts").where("email", "==", body.email).get();
    for (const item of legacy.docs) {
      try {
        if (JSON.stringify(cleanSearchCriteria(item.data().criteria)) === body.criteria) return {ref:item.ref,duplicate:true};
      } catch { /* A legacy malformed request does not block a valid one. */ }
    }
  }
  const id = uniqueKey ? `search-${createHash("sha256").update(uniqueKey).digest("hex")}` :
    typeof submissionId === "string" && /^[0-9a-f-]{36}$/i.test(submissionId)
      ? submissionId
      : randomUUID();
  const fingerprint = createHash("sha256")
    .update(JSON.stringify(body))
    .digest("hex");
  const ref = adminDb().doc(`inquiries/${id}`);
  const throttle = adminDb().doc(
    `contactLimits/${createHash("sha256").update(ip).digest("hex")}`,
  );
  const duplicate = await adminDb().runTransaction(async (tx) => {
    const existing = await tx.get(ref);
    if (existing.exists) {
      if (existing.data()?.fingerprint !== fingerprint)
        throw new Error("SUBMISSION_CONFLICT");
      return true;
    }
    const limit = await tx.get(throttle);
    const recent = ((limit.data()?.attempts || []) as number[]).filter(
      (time) => time > Date.now() - 600000,
    );
    if (recent.length >= 5) throw new Error("RATE_LIMIT");
    tx.set(throttle, { attempts: [...recent, Date.now()] });
    tx.set(ref, {
      ...body,
      fingerprint,
      ...(uniqueKey ? {consentAt:stamp()} : {}),
      status: "new",
      notes: "",
      viewingAt: "",
      version: 0,
      delivery: "pending",
      createdAt: stamp(),
    });
    return false;
  });
  return { ref, duplicate };
}
