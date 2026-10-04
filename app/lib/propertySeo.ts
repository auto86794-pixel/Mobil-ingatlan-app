import type { PropertyWithId } from "./types";

export function knownDate(value: unknown): Date | undefined {
  let date: Date;
  if (value instanceof Date) date = value;
  else if (value && typeof value === "object" && "toDate" in value && typeof value.toDate === "function") date = value.toDate();
  else if (typeof value === "number" && value > 0) date = new Date(value);
  else if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}T/.test(value)) date = new Date(value);
  else return undefined;
  return Number.isFinite(date.getTime()) ? date : undefined;
}

export function propertySeo(property: PropertyWithId) {
  const clean = (text: string) => text.replace(/[^\p{L}\p{N}\s.,()–-]/gu, "").replace(/\s+/g, " ").trim();
  const title = clean(property.title) || "Ingatlan";
  const location = [property.city, property.district].filter(Boolean).join(", ");
  const details = [location, property.area > 0 ? property.area + " m²" : "", property.rooms > 0 ? property.rooms + " szoba" : "", property.price > 0 ? property.price.toLocaleString("hu-HU") + " Ft" : ""].filter(Boolean);
  const heading = [title, ...details.filter(detail => !title.toLocaleLowerCase("hu-HU").includes(detail.toLocaleLowerCase("hu-HU")))].join(" – ");
  const description = [property.listingPurpose === "rent" ? "Kiadó" : "Eladó", property.propertyType || "ingatlan", ...details].join(" • ");
  return { title: heading, description: description.slice(0, 160) };
}

export function serializableProperty(property: PropertyWithId): PropertyWithId {
  return { ...property, createdAt: knownDate(property.createdAt)?.getTime() ?? null, updatedAt: knownDate(property.updatedAt)?.getTime() ?? null };
}

export function jsonLdString(value: unknown) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}
