import { sendBrevoPayload } from "@/app/lib/brevoEmail";
import { reserveAuthEmail } from "@/app/lib/authEmailLimit";
import { SITE_URL } from "@/app/lib/site";
import { NextResponse } from "next/server";
import { getAdminAuth } from "@/app/lib/firebaseAdmin";

export const runtime = "nodejs";


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
    if (!await reserveAuthEmail(email, ip, "reset")) {
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
      url: `${SITE_URL}/login`, handleCodeInApp: false,
    });
    const safeLink = link.replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
    const receipt = await sendBrevoPayload(apiKey, {
        sender: { name: "Debreceni Otthonok", email: sender }, to: [{ email }],
        subject: "Debreceni Otthonok – jelszó-visszaállítás",
        textContent: `Új jelszó beállításához nyisd meg ezt a linket: ${link}\nHa nem te kérted, hagyd figyelmen kívül ezt a levelet.`,
        htmlContent: `<h1>Debreceni Otthonok – jelszó-visszaállítás</h1><p><a href="${safeLink}">Új jelszó beállítása</a></p><p>Ha nem te kérted, hagyd figyelmen kívül ezt a levelet.</p>`,
      });
    // Never log a reset link, its code, or the recipient address.
    console.info("PASSWORD_RESET_ACCEPTED", { messageId: receipt?.messageId });
    return NextResponse.json({ success: true });
  } catch (error) {
    const code = (error as { code?: string }).code || (error instanceof Error ? error.message : "UNKNOWN");
    console.error("PASSWORD_RESET_ERROR", { code: /^(?:[A-Z_0-9]+|auth\/[a-z-]+)$/.test(code) ? code : "INTERNAL_ERROR" });
    return NextResponse.json({ error: "A levélküldés most nem sikerült. Próbáld újra később, vagy jelezd az üzemeltetőnek." }, { status: 503 });
  }
}
