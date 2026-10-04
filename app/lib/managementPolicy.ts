export const propertyStatuses = [
  "active",
  "draft",
  "sold",
  "inactive",
  "archived",
] as const;
export const textFields = [
  "title",
  "city",
  "district",
  "propertyType",
  "listingPurpose",
  "condition",
  "floor",
  "balcony",
  "parking",
  "heating",
  "description",
  "phone",
  "email",
  "imageUrl",
] as const;
export const numericFields = ["price", "area", "rooms", "lat", "lng"] as const;

export function cleanPropertyPatch(input: Record<string, unknown>) {
  const result: Record<string, unknown> = {};
  for (const field of textFields) {
    if (field in input) {
      if (
        typeof input[field] !== "string" ||
        (input[field] as string).length >
          (field === "description" ? 20000 : 1000)
      )
        throw new Error("Érvénytelen szöveges adat.");
      result[field] = (input[field] as string).trim();
    }
  }
  for (const field of numericFields) {
    if (field in input) {
      const value = input[field];
      if (typeof value !== "number" || !Number.isFinite(value))
        throw new Error("Érvénytelen számadat.");
      if (["price", "area", "rooms"].includes(field) && value <= 0)
        throw new Error("Az ár, alapterület és szobaszám pozitív szám legyen.");
      if (
        (field === "lat" && Math.abs(value) > 90) ||
        (field === "lng" && Math.abs(value) > 180)
      )
        throw new Error("Érvénytelen koordináta.");
      result[field] = value;
    }
  }
  if ("status" in input) {
    if (
      !propertyStatuses.includes(
        input.status as (typeof propertyStatuses)[number],
      )
    )
      throw new Error("Érvénytelen státusz.");
    result.status = input.status;
  }
  if ("images" in input) {
    if (
      !Array.isArray(input.images) ||
      input.images.length > 50 ||
      input.images.some(
        (url) =>
          typeof url !== "string" ||
          !url.startsWith("https://") ||
          url.length > 3000,
      )
    )
      throw new Error("Érvénytelen képlista.");
    result.images = input.images;
  }
  if ("featured" in input) {
    if (typeof input.featured !== "boolean")
      throw new Error("Érvénytelen kiemelés.");
    result.featured = input.featured;
  }
  if (
    result.listingPurpose &&
    !["sale", "rent"].includes(String(result.listingPurpose))
  )
    throw new Error("Érvénytelen hirdetéstípus.");
  return result;
}

export function missingPropertyFields(post: {
  area?: number;
  rooms?: number;
  phone?: string;
  images?: string[];
  imageUrl?: string;
  propertyType?: string;
}) {
  return [
    !(post.area && post.area > 0) ? "alapterület" : "",
    !(post.rooms && post.rooms > 0) ? "szobaszám" : "",
    !post.phone?.trim() ? "telefonszám" : "",
    !post.images?.some((image) => image.trim()) && !post.imageUrl?.trim()
      ? "kép"
      : "",
    !post.propertyType?.trim() ? "ingatlantípus" : "",
  ].filter(Boolean);
}

export function assertManageableAccount(
  actorUid: string,
  targetUid: string,
  role: unknown,
) {
  if (actorUid === targetUid)
    throw new Error("A saját fiókodat itt nem módosíthatod.");
  if (role === "admin")
    throw new Error("Adminfiókot nem lehet itt letiltani vagy törölni.");
}
