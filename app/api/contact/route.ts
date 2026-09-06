import { NextResponse } from "next/server";
import { Resend } from "resend";

const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX = 5;
const rateLimitStore = new Map<string, number[]>();

function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown";
  return req.headers.get("x-real-ip")?.trim() || "unknown";
}

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const cutoff = now - RATE_LIMIT_WINDOW_MS;
  const recent = (rateLimitStore.get(ip) || []).filter((timestamp) => timestamp > cutoff);

  if (recent.length >= RATE_LIMIT_MAX) {
    rateLimitStore.set(ip, recent);
    return true;
  }

  recent.push(now);
  rateLimitStore.set(ip, recent);

  // Időnként takarítsuk a régi bejegyzéseket.
  if (rateLimitStore.size > 500) {
    for (const [key, timestamps] of rateLimitStore.entries()) {
      const active = timestamps.filter((timestamp) => timestamp > cutoff);
      if (active.length === 0) rateLimitStore.delete(key);
      else rateLimitStore.set(key, active);
    }
  }

  return false;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function cleanText(value: unknown, maxLength: number): string {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);
    if (isRateLimited(ip)) {
      return NextResponse.json(
        { success: false, error: "Túl sok üzenetet küldtél rövid időn belül. Próbáld újra később." },
        { status: 429, headers: { "Retry-After": "600" } }
      );
    }

    const body = await req.json();

    // Honeypot: normál felhasználó ezt a mezőt soha nem tölti ki.
    const website = cleanText(body.website, 200);
    if (website) {
      return NextResponse.json({ success: true }, { status: 200 });
    }

    const name = cleanText(body.name, 100);
    const email = cleanText(body.email, 254).toLowerCase();
    const message = cleanText(body.message, 3000);
    const propertyTitle = cleanText(body.propertyTitle, 200);
    const propertyId = cleanText(body.propertyId, 100);
    const propertyUrl = cleanText(body.propertyUrl, 500);

    if (!name || !email || !message) {
      return NextResponse.json(
        { success: false, error: "A név, e-mail cím és üzenet megadása kötelező." },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: "Érvénytelen e-mail cím." },
        { status: 400 }
      );
    }

    const recipientEmail = process.env.CONTACT_TO_EMAIL;
    const apiKey = process.env.RESEND_API_KEY;
    if (!recipientEmail || !apiKey) {
      console.error("CONTACT_API_CONFIG_MISSING");
      return NextResponse.json(
        { success: false, error: "Az üzenetküldés átmenetileg nem elérhető." },
        { status: 500 }
      );
    }

    const resend = new Resend(apiKey);
    const safeName = escapeHtml(name);
    const safeEmail = escapeHtml(email);
    const safeMessage = escapeHtml(message).replace(/\r?\n/g, "<br />");
    const safePropertyTitle = escapeHtml(propertyTitle || "Ingatlan");
    const safePropertyId = escapeHtml(propertyId);
    const safePropertyUrl = escapeHtml(propertyUrl);

    const inquiryEmail = await resend.emails.send({
      from: "DebrecenHomes <inquiries@debrecenhomes.hu>",
      to: recipientEmail,
      replyTo: email,
      subject: `Új érdeklődés — ${propertyTitle || "ingatlan"}`,
      html: `
        <div style="font-family:Arial,Helvetica,sans-serif;padding:32px;color:#172019;line-height:1.7">
          <h2>Új ingatlanérdeklődés</h2>
          <p><strong>Ingatlan:</strong><br/>${safePropertyTitle}</p>
          ${safePropertyId ? `<p><strong>Hirdetés azonosító:</strong><br/>${safePropertyId}</p>` : ""}
          ${safePropertyUrl ? `<p><strong>Hirdetés:</strong><br/><a href="${safePropertyUrl}">${safePropertyUrl}</a></p>` : ""}
          <p><strong>Név:</strong><br/>${safeName}</p>
          <p><strong>E-mail:</strong><br/>${safeEmail}</p>
          <p><strong>Üzenet:</strong><br/>${safeMessage}</p>
        </div>
      `,
    });

    if (inquiryEmail.error) throw inquiryEmail.error;

    const autoReply = await resend.emails.send({
      from: "DebrecenHomes <inquiries@debrecenhomes.hu>",
      to: email,
      subject: "Megkaptuk az érdeklődésed",
      html: `
        <div style="background:#fff;padding:40px 24px;font-family:Arial,Helvetica,sans-serif;color:#172019;line-height:1.8;max-width:640px;margin:0 auto">
          <h1>Köszönjük, ${safeName}!</h1>
          <p>Megkaptuk az érdeklődésed a(z) <strong>${safePropertyTitle}</strong> hirdetéssel kapcsolatban.</p>
          <p>Hamarosan felvesszük veled a kapcsolatot.</p>
          <p>— DebrecenHomes</p>
        </div>
      `,
    });

    if (autoReply.error) throw autoReply.error;

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("CONTACT_API_ERROR", error);
    return NextResponse.json(
      { success: false, error: "Hiba történt az üzenet küldésekor." },
      { status: 500 }
    );
  }
}
