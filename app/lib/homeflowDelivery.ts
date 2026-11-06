import { randomUUID } from "node:crypto";
import type { DocumentReference } from "firebase-admin/firestore";
import { adminDb, stamp } from "./managementServer";

// The inquiry is the durable outbox. A lease prevents overlapping admin retries;
// the receiver's submission ID also makes a lost HTTP response safe to retry.
export async function deliverToHomeFlow(ref: DocumentReference) {
  if (!ref.path.startsWith("inquiries/")) return;
  const base = process.env.HOMEFLOW_CRM_URL;
  const secret = process.env.HOMEFLOW_LEAD_SECRET;
  const token = randomUUID();
  const claimed = await adminDb().runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) return null;
    const data = snap.data()!;
    if (data.crmDelivery === "sent" || (data.crmLeaseUntil || 0) > Date.now()) return null;
    if (!base || !secret) {
      tx.update(ref, { crmDelivery: "not_configured" });
      return null;
    }
    tx.update(ref, {
      crmDelivery: "processing", crmLeaseToken: token,
      crmLeaseUntil: Date.now() + 60_000,
      crmAttempts: (data.crmAttempts || 0) + 1, crmLastAttemptAt: stamp(),
    });
    return data;
  });
  if (!claimed) return;
  let state = "failed";
  let code = "NETWORK";
  try {
    const url = new URL(base!);
    if (url.protocol !== "https:" || url.username || url.password) throw new Error("Invalid CRM URL");
    url.pathname = "/api/website-lead";
    url.search = "";
    url.hash = "";
    const response = await fetch(url, {
      method: "POST", redirect: "error", signal: AbortSignal.timeout(12_000),
      headers: { "content-type": "application/json", "x-website-lead-secret": secret! },
      body: JSON.stringify({
        submissionId: ref.id, name: claimed.name, email: claimed.email,
        phone: claimed.phone || "", message: claimed.message || "",
        propertyId: claimed.propertyId || "", propertyTitle: claimed.propertyTitle || "",
        propertyUrl: claimed.propertyUrl || "", kind: claimed.kind || "contact",
        source: claimed.source === "debreceniotthonok.hu" ? "debreceniotthonok.hu" : "debrecenhomes.hu",
        receivedAt: claimed.createdAt?.toDate?.().toISOString() || claimed.createdAt,
      }),
    });
    code = `HTTP_${response.status}`;
    if (response.ok) {
      const result = await response.json();
      if (result?.success === true) { state = "sent"; code = ""; }
      else code = "INVALID_RESPONSE";
    } else if (response.status === 409) state = "review";
  } catch {
    // Never log the contact data, response body, or shared secret.
  }
  await adminDb().runTransaction(async (tx) => {
    const current = await tx.get(ref);
    if (current.data()?.crmLeaseToken !== token) return;
    tx.update(ref, {
      crmDelivery: state, crmErrorCode: code, crmLeaseUntil: 0,
      ...(state === "sent" ? { crmDeliveredAt: stamp() } : {}),
    });
  });
}
