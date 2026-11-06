import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { captureInquiry } from "@/app/lib/inquiryCapture";
import { deliverToHomeFlow } from "@/app/lib/homeflowDelivery";
import { adminDb } from "@/app/lib/managementServer";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  const secret = process.env.LANDING_LEAD_SECRET || "";
  const supplied = request.headers.get("x-landing-lead-secret") || "";
  if (!secret || Buffer.byteLength(secret) !== Buffer.byteLength(supplied) ||
    !timingSafeEqual(Buffer.from(secret), Buffer.from(supplied)))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const raw = await request.text();
    if (Buffer.byteLength(raw) > 10000) return NextResponse.json({ error: "Too large" }, { status: 413 });
    const body = JSON.parse(raw);
    if (!body || typeof body !== "object" || Array.isArray(body)) throw new Error("INVALID");
    const {submissionId,name,email,phone,ip,emailDelivery}=body;
    if (typeof submissionId !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(submissionId) ||
      typeof name !== "string" || name.trim().length < 2 || name.length > 100 ||
      typeof email !== "string" || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      typeof phone !== "string" || phone.length > 40 || !["pending","sent","failed"].includes(emailDelivery))
      return NextResponse.json({ error: "Invalid lead" }, { status: 400 });
    const saved = await captureInquiry({
      name:name.trim(), email:email.trim().toLowerCase(), phone:phone.trim(),
      message:"Lakáskeresési érdeklődés a debreceniotthonok.hu oldalról. Adatkezelési hozzájárulás megadva.",
      propertyTitle:"Lakáskeresés fiataloknak", propertyId:"", propertyUrl:"https://www.debreceniotthonok.hu/",
      source:"debreceniotthonok.hu",
    }, submissionId, `landing:${typeof ip === "string" ? ip.slice(0,100) : "unknown"}`);
    // An e-mail status update must never downgrade a confirmed delivery.
    const notificationSent = await adminDb().runTransaction(async tx => {
      const current = await tx.get(saved.ref);
      if (current.data()?.delivery === "sent") return true;
      tx.update(saved.ref, {delivery:emailDelivery === "pending" ? "external_pending" : emailDelivery});
      return emailDelivery === "sent";
    });
    await deliverToHomeFlow(saved.ref).catch(() => console.error("LANDING_CRM_STATE_ERROR"));
    return NextResponse.json({success:true,notificationSent});
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    const status = message === "RATE_LIMIT" ? 429 : message === "SUBMISSION_CONFLICT" ? 409 : message === "INVALID" || error instanceof SyntaxError ? 400 : 503;
    console.error("LANDING_INBOX_ERROR", {status});
    return NextResponse.json({error:"Lead not accepted"}, {status});
  }
}
