import { NextResponse } from "next/server";

import { getAdminAuth } from "@/app/lib/firebaseAdmin";

function escapeHtml(value: string) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}

export async function POST(request: Request) {
  try {
    const authorization = request.headers.get("authorization");
    if (!authorization?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Hiányzó hitelesítés." }, { status: 401 });
    }

    const adminAuth = getAdminAuth();
    const decoded = await adminAuth.verifyIdToken(authorization.slice(7));
    if (!decoded.email || decoded.email_verified) {
      return NextResponse.json({ error: decoded.email_verified ? "Az e-mail cím már megerősített." : "A fiókhoz nem tartozik e-mail cím." }, { status: 400 });
    }

    const apiKey = process.env.BREVO_API_KEY;
    const senderEmail = process.env.BREVO_FROM_EMAIL;
    if (!apiKey || !senderEmail) throw new Error("BREVO_CONFIG_MISSING");

    const verificationLink = await adminAuth.generateEmailVerificationLink(decoded.email, {
      url: "https://debrecenhomes.hu/login",
      handleCodeInApp: false,
    });
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: { accept: "application/json", "content-type": "application/json", "api-key": apiKey },
      body: JSON.stringify({
        sender: { name: "DebrecenHomes", email: senderEmail },
        to: [{ email: decoded.email }],
        subject: "Erősítsd meg a DebrecenHomes fiókodat",
        htmlContent: `<div style="font-family:Arial,Helvetica,sans-serif;max-width:620px;margin:auto;padding:36px;color:#172019;line-height:1.7"><h1>E-mail-cím megerősítése</h1><p>A DebrecenHomes fiókod aktiválásához kattints az alábbi gombra:</p><p style="margin:28px 0"><a href="${escapeHtml(verificationLink)}" style="display:inline-block;background:#176b3a;color:#fff;text-decoration:none;padding:14px 22px;border-radius:12px;font-weight:bold">E-mail-cím megerősítése</a></p><p style="font-size:13px;color:#6c776f">A link ehhez a címhez tartozik: ${escapeHtml(decoded.email)}.</p></div>`,
      }),
    });
    const brevoBody = await response.text();
    if (!response.ok) {
      console.error("BREVO_VERIFICATION_SEND_ERROR", response.status, brevoBody);
      throw new Error("BREVO_SEND_FAILED");
    }
    console.log("BREVO_VERIFICATION_SENT", { uid: decoded.uid, status: response.status, response: brevoBody });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("VERIFICATION_EMAIL_ERROR", error);
    return NextResponse.json({ error: "A megerősítő levél küldése most nem sikerült." }, { status: 500 });
  }
}
