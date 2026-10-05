import { FieldValue, getFirestore } from "firebase-admin/firestore";
import { NextResponse } from "next/server";
import { getAdminAuth } from "./firebaseAdmin";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export const adminDb = () => getFirestore(getAdminAuth().app);
export const stamp = () => FieldValue.serverTimestamp();

export async function requireAccount(request: Request, adminOnly = false) {
  const token = request.headers.get("authorization")?.replace(/^Bearer /, "");
  if (!token || !request.headers.get("authorization")?.startsWith("Bearer "))
    throw new ApiError(401, "Jelentkezz be.");
  let decoded;
  try {
    decoded = await getAdminAuth().verifyIdToken(token, true);
  } catch {
    throw new ApiError(401, "A munkamenet lejárt. Jelentkezz be újra.");
  }
  if (!decoded.email_verified)
    throw new ApiError(403, "Megerősített e-mail-cím szükséges.");
  const profile = await adminDb().doc(`users/${decoded.uid}`).get();
  const data = profile.data();
  if (
    !profile.exists ||
    data?.disabled ||
    ["deleting", "deleted"].includes(data?.accountState)
  )
    throw new ApiError(403, "A fiók nem használható.");
  const isAdmin = data?.role === "admin";
  if (adminOnly && !isAdmin)
    throw new ApiError(403, "Admin jogosultság szükséges.");
  const origin = request.headers.get("origin");
  const allowedOrigins = new Set([
    new URL(request.url).origin,
    "https://debrecenhomes.hu",
    "https://www.debrecenhomes.hu",
      "https://debreceniotthonok.hu",
      "https://www.debreceniotthonok.hu",
  ]);
  if (process.env.NODE_ENV === "development") {
    allowedOrigins.add("http://localhost:3000");
    allowedOrigins.add("http://127.0.0.1:3000");
  }
  if (request.method !== "GET" && origin && !allowedOrigins.has(origin))
    throw new ApiError(403, "Érvénytelen kérés.");
  return { uid: decoded.uid, email: decoded.email || "", isAdmin };
}

export function apiFailure(error: unknown) {
  if (error instanceof ApiError)
    return NextResponse.json(
      { error: error.message },
      { status: error.status },
    );
  console.error("MANAGEMENT_ERROR", {
    code: (error as { code?: string }).code || "INTERNAL",
  });
  return NextResponse.json(
    { error: "A művelet nem sikerült. Próbáld újra; az adatok megmaradtak." },
    { status: 500 },
  );
}

export function serializable(value: unknown): unknown {
  if (
    value &&
    typeof value === "object" &&
    "toDate" in value &&
    typeof (value as { toDate?: unknown }).toDate === "function"
  )
    return (value as { toDate(): Date }).toDate().toISOString();
  if (Array.isArray(value)) return value.map(serializable);
  if (value && typeof value === "object")
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, serializable(item)]),
    );
  return value;
}
