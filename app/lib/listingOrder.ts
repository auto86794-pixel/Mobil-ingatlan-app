export function listingCreatedMillis(value: unknown): number | null {
  let millis: unknown;
  if (typeof value === "number") millis = value;
  else if (value instanceof Date) millis = value.getTime();
  else if (value && typeof value === "object") {
    const timestamp = value as { toMillis?: () => number; seconds?: number; nanoseconds?: number };
    if (typeof timestamp.toMillis === "function") millis = timestamp.toMillis();
    else if (typeof timestamp.seconds === "number") millis = timestamp.seconds * 1000 + (timestamp.nanoseconds || 0) / 1000000;
  }
  return typeof millis === "number" && Number.isFinite(millis) ? millis : null;
}

export function sortListings<T extends { id: string; createdAt?: unknown }>(posts: T[], order: "newest" | "oldest"): T[] {
  return [...posts].sort((a, b) => {
    const first = listingCreatedMillis(a.createdAt);
    const second = listingCreatedMillis(b.createdAt);
    if (first === null && second !== null) return 1;
    if (second === null && first !== null) return -1;
    const difference = first !== null && second !== null ? first - second : 0;
    return (order === "newest" ? -difference : difference) || a.id.localeCompare(b.id);
  });
}

export function filterListings<T extends { title: string; createdAt?: unknown }>(posts: T[], name: string, from: string, until: string): T[] {
  const normalize = (text: string) => text.toLocaleLowerCase("hu-HU").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const search = normalize(name.trim());
  const start = from ? new Date(`${from}T00:00:00`).getTime() : null;
  const end = until ? new Date(`${until}T23:59:59.999`).getTime() : null;
  return posts.filter((post) => {
    if (search && !normalize(post.title).includes(search)) return false;
    if (start === null && end === null) return true;
    const created = listingCreatedMillis(post.createdAt);
    return created !== null && (start === null || created >= start) && (end === null || created <= end);
  });
}
