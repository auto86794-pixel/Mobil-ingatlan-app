import { uniqueInquiries } from "@/app/lib/uniqueInquiries";
import { searchCriteriaMessage } from "@/app/lib/searchCriteria";
import { NextResponse } from "next/server";
import {
  adminDb,
  ApiError,
  apiFailure,
  requireAccount,
  serializable,
  stamp,
} from "@/app/lib/managementServer";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  try {
    await requireAccount(request, true);
    const db = adminDb();
    const legacy = new URL(request.url).searchParams.get("source") === "legacy";
    const source = legacy ? "searchAlerts" : "inquiries";
    let query = db
      .collection(source)
      .orderBy("createdAt", "desc")
      .limit(50);
    const cursor = new URL(request.url).searchParams.get("cursor");
    if (cursor) {
      if (!/^[\w-]+$/.test(cursor))
        throw new ApiError(400, "Érvénytelen lapozás.");
      const last = await db.doc(`${source}/${cursor}`).get();
      if (last.exists) query = query.startAfter(last);
    }
    const snapshot = await query.get();
    return NextResponse.json({
      inquiries: uniqueInquiries(snapshot.docs.map((item) => ({
        ...(serializable(item.data()) as object),
        id: legacy ? `legacy_${item.id}` : item.id,
        ...(legacy ? {name:"Ingatlant kereső",phone:"",propertyId:"",propertyTitle:"Keresési igény",message:searchCriteriaMessage(item.data().criteria || {}),status:item.data().status === "pending" ? "new" : item.data().status || "new",notes:item.data().notes || "",viewingAt:item.data().viewingAt || "",version:item.data().version || 0,delivery:"legacy"} : {}),
      }))),
      cursor: snapshot.size === 50 ? snapshot.docs.at(-1)!.id : null,
    });
  } catch (error) {
    return apiFailure(error);
  }
}
export async function PATCH(request: Request) {
  try {
    const actor = await requireAccount(request, true);
    const body = await request.json();
    if (
      !/^[\w-]+$/.test(body.id || "") ||
      !["new", "callback", "viewing", "closed"].includes(body.status) ||
      typeof body.notes !== "string" ||
      body.notes.length > 5000 ||
      !Number.isInteger(body.expectedVersion)
    )
      throw new ApiError(400, "Érvénytelen érdeklődési adat.");
    const date = body.viewingAt ? new Date(body.viewingAt) : null;
    if (date && !Number.isFinite(date.getTime()))
      throw new ApiError(400, "Érvénytelen időpont.");
    const db = adminDb(),
      ref = body.id.startsWith("legacy_") ? db.doc(`searchAlerts/${body.id.slice(7)}`) : db.doc(`inquiries/${body.id}`);
    await db.runTransaction(async (tx) => {
      const [item, profile] = await tx.getAll(
        ref,
        db.doc(`users/${actor.uid}`),
      );
      if (
        profile.data()?.role !== "admin" ||
        profile.data()?.disabled ||
        profile.data()?.accountState === "deleting"
      )
        throw new ApiError(403, "Nincs admin jogosultságod.");
      if (!item.exists) throw new ApiError(404, "Az érdeklődés nem található.");
      const version = item.data()?.version || 0;
      if (version !== body.expectedVersion)
        throw new ApiError(409, "Közben módosították. Frissítsd a listát.");
      tx.set(ref.collection("history").doc(), {
        before: item.data(),
        actorUid: actor.uid,
        createdAt: stamp(),
      });
      tx.update(ref, {
        status: body.status,
        notes: body.notes.trim(),
        viewingAt: date?.toISOString() || "",
        version: version + 1,
        updatedAt: stamp(),
        updatedBy: actor.uid,
      });
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return apiFailure(error);
  }
}
