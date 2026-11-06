import { NextResponse } from "next/server";
import { adminDb, ApiError, apiFailure, requireAccount } from "@/app/lib/managementServer";
import { deliverToHomeFlow } from "@/app/lib/homeflowDelivery";

export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    await requireAccount(request, true);
    const body = await request.json();
    if (typeof body.id !== "string" || !/^[\w-]{1,150}$/.test(body.id))
      throw new ApiError(400, "Érvénytelen érdeklődés.");
    const ref = adminDb().doc(`inquiries/${body.id}`);
    if (!(await ref.get()).exists) throw new ApiError(404, "Az érdeklődés nem található.");
    await deliverToHomeFlow(ref);
    return NextResponse.json({ success: true, crmDelivery: (await ref.get()).data()?.crmDelivery || "pending" });
  } catch (error) { return apiFailure(error); }
}
