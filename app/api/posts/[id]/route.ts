import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import {
  adminDb,
  ApiError,
  apiFailure,
  requireAccount,
  serializable,
  stamp,
} from "@/app/lib/managementServer";
import { cleanPropertyPatch } from "@/app/lib/managementPolicy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
type Context = { params: { id: string } };

export async function GET(request: Request, { params }: Context) {
  try {
    const actor = await requireAccount(request);
    const ref = adminDb().doc(`posts/${params.id}`);
    const post = await ref.get();
    if (!post.exists) throw new ApiError(404, "Az ingatlan nem található.");
    if (!actor.isAdmin && post.data()?.userId !== actor.uid)
      throw new ApiError(403, "Nincs jogosultságod.");
    const history = await ref
      .collection("history")
      .orderBy("version", "desc")
      .limit(100)
      .get();
    return NextResponse.json({
      history: history.docs.map((item) => ({
        id: item.id,
        ...(serializable(item.data()) as object),
      })),
    });
  } catch (error) {
    return apiFailure(error);
  }
}

export async function PATCH(request: Request, { params }: Context) {
  try {
    const actor = await requireAccount(request);
    const body = await request.json();
    if (!Number.isInteger(body.expectedVersion) || body.expectedVersion < 0)
      throw new ApiError(400, "Hiányzó verzió. Töltsd újra az adatlapot.");
    const db = adminDb();
    const ref = db.doc(`posts/${params.id}`);
    await db.runTransaction(async (tx) => {
      const [post, actorProfile] = await tx.getAll(
        ref,
        db.doc(`users/${actor.uid}`),
      );
      if (!post.exists) throw new ApiError(404, "Az ingatlan nem található.");
      if (
        !actorProfile.exists ||
        actorProfile.data()?.disabled ||
        actorProfile.data()?.accountState === "deleting"
      )
        throw new ApiError(403, "A fiók nem használható.");
      const isAdmin = actorProfile.data()?.role === "admin";
      const current = post.data()!;
      if (!isAdmin && current.userId !== actor.uid)
        throw new ApiError(403, "Nincs jogosultságod.");
      const version = Number(current.version || 0);
      if (version !== body.expectedVersion)
        throw new ApiError(
          409,
          "Az ingatlant közben módosították. Töltsd újra, majd ellenőrizd az adatokat.",
        );
      let patch: Record<string, unknown>;
      if (body.action === "restore") {
        if (!isAdmin)
          throw new ApiError(
            403,
            "Az előzmény visszaállításához admin jogosultság szükséges.",
          );
        if (
          typeof body.historyId !== "string" ||
          !/^[\w-]+$/.test(body.historyId)
        )
          throw new ApiError(400, "Érvénytelen előzmény.");
        const previous = await tx.get(
          ref.collection("history").doc(body.historyId),
        );
        if (!previous.exists)
          throw new ApiError(404, "Az előzmény nem található.");
        // Restore content without restoring old ownership or bypassing lifecycle locks.
        const before = previous.data()!.before;
        patch = Object.fromEntries(
          Object.entries(before).filter(
            ([key]) =>
              ![
                "userId",
                "createdAt",
                "updatedAt",
                "version",
                "archivedAt",
                "archivedBy",
              ].includes(key),
          ),
        );
      } else if (body.action === "archive") {
        if (current.status === "archived")
          throw new ApiError(400, "A hirdetés már archiválva van.");
        patch = {
          status: "archived",
          previousStatus: current.status || "active",
          archivedAt: stamp(),
          archivedBy: actor.uid,
        };
      } else if (body.action === "unarchive") {
        if (current.status !== "archived")
          throw new ApiError(400, "Ez a hirdetés nincs archiválva.");
        patch = {
          status: ["active", "sold", "draft", "inactive"].includes(
            current.previousStatus,
          )
            ? current.previousStatus
            : "inactive",
        };
      } else if (body.action === "update") {
        if (current.status === "archived")
          throw new ApiError(
            400,
            "Előbb állítsd vissza az archivált hirdetést.",
          );
        try {
          patch = cleanPropertyPatch(body.patch || {});
        } catch (error) {
          throw new ApiError(400, (error as Error).message);
        }
        if (patch.status === "archived")
          throw new ApiError(400, "Használd az archiválás műveletet.");
        if (
          !isAdmin &&
          "featured" in patch &&
          patch.featured !== current.featured
        )
          throw new ApiError(403, "A kiemelést az admin kezeli.");
        if (
          ("title" in patch && !patch.title) ||
          ("city" in patch && !patch.city)
        )
          throw new ApiError(400, "A cím és város nem lehet üres.");
      } else throw new ApiError(400, "Ismeretlen művelet.");
      tx.set(ref.collection("history").doc(), {
        before: current,
        version: version + 1,
        action: body.action,
        actorUid: actor.uid,
        actorEmail: actor.email,
        createdAt: stamp(),
      });
      tx.update(ref, { ...patch, version: version + 1, updatedAt: stamp() });
    });
    revalidatePath("/");
    revalidatePath("/properties");
    revalidatePath(`/post/${params.id}`);
    revalidatePath("/sitemap.xml");
    return NextResponse.json({ success: true });
  } catch (error) {
    return apiFailure(error);
  }
}
