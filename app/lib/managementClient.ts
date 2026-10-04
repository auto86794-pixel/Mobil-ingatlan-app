import { auth } from "./firebase";

export async function managementRequest<T = Record<string, unknown>>(
  path: string,
  body?: unknown,
  method = "POST",
): Promise<T> {
  const account = auth.currentUser;
  if (!account) throw new Error("Jelentkezz be.");
  const token = await account.getIdToken();
  const result = await fetch(path, {
    method: body === undefined ? "GET" : method,
    headers: {
      Authorization: `Bearer ${token}`,
      "content-type": "application/json",
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: "no-store",
    signal: AbortSignal.timeout(90000),
  });
  const data = await result.json();
  if (!result.ok) throw new Error(data.error || "A művelet nem sikerült.");
  return data;
}
