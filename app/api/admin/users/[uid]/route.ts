import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { getAdminAuth } from "@/app/lib/firebaseAdmin";
import {
  adminDb,
  ApiError,
  apiFailure,
  requireAccount,
  serializable,
  stamp,
} from "@/app/lib/managementServer";
import { assertManageableAccount } from "@/app/lib/managementPolicy";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;
type Context = { params: { uid: string } };
async function authUser(uid: string) {
  try {
    return await getAdminAuth().getUser(uid);
  } catch (error) {
    if ((error as { code: string }).code === "auth/user-not-found") return null;
    throw error;
  }
}
export async function GET(request: Request, { params }: Context) {
  try {
    await requireAccount(request, true);
    const db = adminDb();
    const [user, profile, posts, operation] = await Promise.all([
      authUser(params.uid),
      db.doc(`users/${params.uid}`).get(),
      db.collection("posts").where("userId", "==", params.uid).get(),
      db.doc(`accountOperations/${params.uid}`).get(),
    ]);
    if (!user && !profile.exists && !operation.exists)
      throw new ApiError(404, "A fiók nem található.");
    return NextResponse.json({
      email:
        user?.email ||
        profile.data()?.email ||
        operation.data()?.email ||
        params.uid,
      posts: posts.docs.map((post) => ({
        id: post.id,
        title: post.data().title || "Névtelen ingatlan",
        status: post.data().status,
      })),
      operation: serializable(
        operation.data()?.state === "transferring" ? operation.data() : null,
      ),
    });
  } catch (error) {
    return apiFailure(error);
  }
}
export async function POST(request: Request, { params }: Context) {
  let lease: string | undefined;
  let db: ReturnType<typeof adminDb> | undefined;
  let operation: ReturnType<ReturnType<typeof adminDb>["doc"]> | undefined;
  try {
    db = adminDb();
    const target = db.doc(`users/${params.uid}`);
    operation = db.doc(`accountOperations/${params.uid}`);
    const database = db,
      operationRef = operation;
    const actor = await requireAccount(request, true);
    const body = await request.json();
    const user = await authUser(params.uid);
    if (!["disable", "enable", "delete", "role"].includes(body.action))
      throw new ApiError(400, "Ismeretlen művelet.");
    const email =
      user?.email ||
      (await target.get()).data()?.email ||
      (await operationRef.get()).data()?.email ||
      params.uid;
    if (body.action === "delete" && body.confirmation !== email)
      throw new ApiError(400, "A törléshez pontosan írd be az e-mail-címet.");
    if (
      body.action === "delete" &&
      (!body.recipient || body.recipient === params.uid)
    )
      throw new ApiError(400, "Válassz új tulajdonost az ingatlanoknak.");
    const recipient =
      body.action === "delete" ? await authUser(body.recipient) : null;
    if (
      body.action === "delete" &&
      (!recipient || recipient.disabled || !recipient.emailVerified)
    )
      throw new ApiError(400, "Megerősített, aktív átvevő szükséges.");
    lease = randomUUID();
    await database.runTransaction(async (tx) => {
      const refs = [target, database.doc(`users/${actor.uid}`), operationRef];
      if (body.action === "delete")
        refs.push(database.doc(`users/${body.recipient}`));
      const [profile, actorProfile, op, recipientProfile] = await tx.getAll(
        ...refs,
      );
      if (
        actorProfile.data()?.role !== "admin" ||
        actorProfile.data()?.disabled ||
        actorProfile.data()?.accountState === "deleting"
      )
        throw new ApiError(403, "Nincs admin jogosultságod.");
      if (op.data()?.leaseUntil > Date.now())
        throw new ApiError(
          409,
          "Fiókművelet folyamatban. Próbáld újra két perc múlva.",
        );
      if (body.action === "role") {
        if (actor.uid === params.uid)
          throw new ApiError(403, "A saját jogosultságodat nem módosíthatod.");
        if (
          !["user", "admin"].includes(body.role) ||
          !user ||
          user.disabled ||
          !user.emailVerified ||
          profile.data()?.disabled ||
          profile.data()?.accountState === "deleting"
        )
          throw new ApiError(400, "Aktív, megerősített fiók szükséges.");
        if (
          op.data()?.state &&
          !["idle", "completed"].includes(op.data()?.state)
        )
          throw new ApiError(409, "Folyamatban lévő fiókművelet.");
        tx.set(
          target,
          { role: body.role, email, updatedAt: stamp() },
          { merge: true },
        );
        tx.set(database.collection("accountAudit").doc(), {
          action: "role",
          targetUid: params.uid,
          role: body.role,
          actorUid: actor.uid,
          createdAt: stamp(),
        });
        return;
      }
      try {
        assertManageableAccount(actor.uid, params.uid, profile.data()?.role);
      } catch (error) {
        throw new ApiError(403, (error as Error).message);
      }
      if (body.action !== "delete") {
        if (!user) throw new ApiError(404, "Nincs bejelentkezési fiók.");
        if (
          profile.data()?.accountState === "deleting" ||
          op.data()?.state === "completed"
        )
          throw new ApiError(
            409,
            "A törlés alatt álló fiókot nem lehet aktiválni.",
          );
        tx.set(
          operationRef,
          {
            state: "account-update",
            lease,
            leaseUntil: Date.now() + 120000,
            email,
          },
          { merge: true },
        );
        tx.set(
          target,
          { disabled: body.action === "disable", email, updatedAt: stamp() },
          { merge: true },
        );
        tx.set(database.collection("accountAudit").doc(), {
          action: body.action,
          targetUid: params.uid,
          actorUid: actor.uid,
          createdAt: stamp(),
        });
        return;
      }
      if (
        recipientProfile?.data()?.role !== "admin" ||
        recipientProfile.data()?.disabled ||
        recipientProfile.data()?.accountState === "deleting"
      )
        throw new ApiError(400, "Aktív adminnak adhatók át az ingatlanok.");
      if (op.data()?.state === "completed") return;
      if (op.data()?.recipient && op.data()?.recipient !== body.recipient)
        throw new ApiError(
          409,
          "A megkezdett törlés átvevője nem módosítható.",
        );
      if (op.data()?.leaseUntil > Date.now())
        throw new ApiError(
          409,
          "A törlés már folyamatban van. Várj két percet, majd folytasd.",
        );
      tx.set(
        operationRef,
        {
          state: "transferring",
          recipient: body.recipient,
          email,
          actorUid: actor.uid,
          lease,
          leaseUntil: Date.now() + 120000,
          updatedAt: stamp(),
          ...(op.data()?.before
            ? {}
            : { before: profile.data() || {}, createdAt: stamp() }),
        },
        { merge: true },
      );
      tx.set(
        target,
        { disabled: true, accountState: "deleting", email, role: "user" },
        { merge: true },
      );
    });
    if (body.action === "role") return NextResponse.json({ success: true });
    if (body.action !== "delete") {
      await getAdminAuth().updateUser(params.uid, {
        disabled: body.action === "disable",
      });
      if (body.action === "disable")
        await getAdminAuth().revokeRefreshTokens(params.uid);
      return NextResponse.json({ success: true });
    }
    if ((await operationRef.get()).data()?.state === "completed")
      return NextResponse.json({ success: true, pending: false });
    if (user) {
      await getAdminAuth().updateUser(params.uid, { disabled: true });
      await getAdminAuth().revokeRefreshTokens(params.uid);
    }
    const posts = await database
      .collection("posts")
      .where("userId", "==", params.uid)
      .limit(40)
      .get();
    // Every transfer writes its own history atomically. Retrying never transfers twice.
    const deadline = Date.now() + 35000;
    for (const post of posts.docs) {
      if (Date.now() > deadline) break;
      await database.runTransaction(async (tx) => {
        const [fresh, op, receiver] = await tx.getAll(
          post.ref,
          operationRef,
          database.doc(`users/${body.recipient}`),
        );
        if (op.data()?.lease !== lease)
          throw new ApiError(
            409,
            "A műveletet egy másik munkamenet folytatja.",
          );
        if (
          receiver.data()?.role !== "admin" ||
          receiver.data()?.disabled ||
          receiver.data()?.accountState === "deleting"
        )
          throw new ApiError(409, "Az átvevő fiókja megváltozott.");
        const data = fresh.data();
        if (!data || data.userId !== params.uid) return;
        const version = Number(data.version || 0) + 1;
        tx.set(post.ref.collection("history").doc(), {
          before: data,
          version,
          action: "transfer",
          actorUid: actor.uid,
          actorEmail: actor.email,
          createdAt: stamp(),
        });
        tx.update(post.ref, {
          userId: body.recipient,
          version,
          updatedAt: stamp(),
        });
      });
    }
    const remaining = await database
      .collection("posts")
      .where("userId", "==", params.uid)
      .limit(1)
      .get();
    if (!remaining.empty)
      return NextResponse.json({ success: true, pending: true });
    const favorites = await database
      .collection("favorites")
      .where("userId", "==", params.uid)
      .limit(100)
      .get();
    if (!favorites.empty) {
      const batch = database.batch();
      for (const favorite of favorites.docs) batch.delete(favorite.ref);
      await batch.commit();
    }
    if (
      !(
        await database
          .collection("favorites")
          .where("userId", "==", params.uid)
          .limit(1)
          .get()
      ).empty
    )
      return NextResponse.json({ success: true, pending: true });
    // Auth is removed only after all properties have a new owner; the journal survives retries.
    if (await authUser(params.uid)) await getAdminAuth().deleteUser(params.uid);
    await database.runTransaction(async (tx) => {
      const op = await tx.get(operationRef);
      if (op.data()?.lease !== lease)
        throw new ApiError(409, "A műveletet másik munkamenet folytatja.");
      tx.delete(target);
      tx.set(
        operationRef,
        { state: "completed", leaseUntil: 0, updatedAt: stamp() },
        { merge: true },
      );
    });
    return NextResponse.json({ success: true, pending: false });
  } catch (error) {
    return apiFailure(error);
  } finally {
    if (lease && db && operation) {
      const ref = operation;
      await db
        .runTransaction(async (tx) => {
          const op = await tx.get(ref);
          if (op.data()?.lease === lease)
            tx.update(ref, {
              leaseUntil: 0,
              ...(op.data()?.state === "account-update"
                ? { state: "idle" }
                : {}),
            });
        })
        .catch(() => {});
    }
  }
}
