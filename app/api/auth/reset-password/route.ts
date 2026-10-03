import { createHash } from "node:crypto";
import { getFirestore } from "firebase-admin/firestore";
import { NextResponse } from "next/server";
import { getAdminAuth } from "@/app/lib/firebaseAdmin";

export const runtime = "nodejs";

// Shared between server instances; clients cannot access this collection.
async function reserveReset(email: string, ip: string) {
  const db = getFirestore(getAdminAuth().app);
  const now = Date.now();
  const keys = [
    { key: `email:${email}`, window: 60_000, limit: 1 },
    { key: `ip:${ip}`, window: 600_000, limit: 10 },
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

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) {
    return NextResponse.json({ error: "Érvénytelen kérés." }, { status: 403 });
  }
  let email: string;
  try {
    const body = await request.json();
    email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("INVALID_EMAIL");
  } catch {
    return NextResponse.json({ error: "Adj meg érvényes e-mail-címet." }, { status: 400 });
  }

  try {
    const apiKey = process.env.BREVO_API_KEY;
    const sender = process.env.BREVO_FROM_EMAIL;
    if (!apiKey || !sender) throw new Error("BREVO_CONFIG_MISSING");
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    if (!await reserveReset(email, ip)) {
      return NextResponse.json({ error: "Túl sok kérés. Próbáld újra néhány perc múlva." }, { status: 429 });
    }
    const admin = getAdminAuth();
    // Do not reveal whether an address has an account.
    try {
      const account = await admin.getUserByEmail(email);
      if (account.disabled) return NextResponse.json({ success: true });
    } catch (error) {
      if ((error as { code?: string }).code === "auth/user-not-found") return NextResponse.json({ success: true });
      throw error;
    }
    const link = await admin.generatePasswordResetLink(email, {
      url: "https://debrecenhomes.hu/login", handleCodeInApp: false,
    });
    const safeLink = link.replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
    const result = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST", signal: AbortSignal.timeout(15_000),
      headers: { "content-type": "application/json", "api-key": apiKey, accept: "application/json" },
      body: JSON.stringify({
        sender: { name: "DebrecenHomes", email: sender }, to: [{ email }],
        subject: "DebrecenHomes – jelszó-visszaállítás",
        textContent: `Új jelszó beállításához nyisd meg ezt a linket: ${link}\nHa nem te kérted, hagyd figyelmen kívül ezt a levelet.`,
        htmlContent: `<h1>DebrecenHomes – jelszó-visszaállítás</h1><p><a href="${safeLink}">Új jelszó beállítása</a></p><p>Ha nem te kérted, hagyd figyelmen kívül ezt a levelet.</p>`,
      }),
    });
    if (!result.ok) throw new Error(`BREVO_SEND_FAILED_${result.status}`);
    // Never log a reset link, its code, or the recipient address.
    const receipt = await result.json();
    console.info("PASSWORD_RESET_ACCEPTED", { messageId: receipt.messageId });
    return NextResponse.json({ success: true });
  } catch (error) {
    const code = (error as { code?: string }).code || (error instanceof Error ? error.message : "UNKNOWN");
    console.error("PASSWORD_RESET_ERROR", { code: /^(?:[A-Z_0-9]+|auth\/[a-z-]+)$/.test(code) ? code : "INTERNAL_ERROR" });
    return NextResponse.json({ error: "A levélküldés most nem sikerült. Próbáld újra később, vagy jelezd az üzemeltetőnek." }, { status: 503 });
  }
}
