import { NextResponse } from "next/server";
import { getAdminAuth } from "@/app/lib/firebaseAdmin";
import {
  adminDb,
  apiFailure,
  requireAccount,
} from "@/app/lib/managementServer";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  try {
    await requireAccount(request, true);
    const url = new URL(request.url);
    const page = await getAdminAuth().listUsers(
      100,
      url.searchParams.get("cursor") || undefined,
    );
    const profiles = page.users.length
      ? await adminDb().getAll(
          ...page.users.map((user) => adminDb().doc(`users/${user.uid}`)),
        )
      : [];
    const orphanProfiles = !url.searchParams.has("cursor")
      ? await adminDb().collection("users").limit(100).get()
      : null;
    const orphans: object[] = [];
    if (orphanProfiles)
      await Promise.all(
        orphanProfiles.docs
          .filter(
            (profile) => !page.users.some((user) => user.uid === profile.id),
          )
          .map(async (profile) => {
            try {
              await getAdminAuth().getUser(profile.id);
            } catch (error) {
              if ((error as { code?: string }).code !== "auth/user-not-found")
                throw error;
              orphans.push({
                id: profile.id,
                email: profile.data().email || profile.id,
                role: profile.data().role === "admin" ? "admin" : "user",
                disabled: true,
                verified: false,
                deleting: profile.data().accountState === "deleting",
                hasAuth: false,
              });
            }
          }),
      );
    return NextResponse.json({
      users: [
        ...page.users.map((user, i) => ({
          id: user.uid,
          email: user.email || user.uid,
          role: profiles[i]?.data()?.role === "admin" ? "admin" : "user",
          disabled: user.disabled || profiles[i]?.data()?.disabled === true,
          verified: user.emailVerified,
          deleting: profiles[i]?.data()?.accountState === "deleting",
        })),
        ...orphans,
      ],
      cursor: page.pageToken || null,
    });
  } catch (error) {
    return apiFailure(error);
  }
}
