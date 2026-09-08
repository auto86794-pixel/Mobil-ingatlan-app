export type PropertyStatus = "active" | "draft" | "sold" | "inactive";
export type ListingPurpose = "sale" | "rent";

export type Property = {
  id?: string;
  title: string;
  city: string;
  district: string;
  price: number;
  propertyType: string;
  listingPurpose: ListingPurpose;
  area: number;
  rooms: number;
  condition: string;
  floor: string;
  balcony: string;
  parking: string;
  heating: string;
  description: string;
  imageUrl: string;
  images: string[];
  phone: string;
  email: string;
  userId: string;
  featured: boolean;
  status: PropertyStatus;
  lat: number;
  lng: number;
  createdAt?: unknown;
  updatedAt?: unknown;
};

export type PropertyWithId = Property & { id: string };

const stringValue = (value: unknown, fallback = "") =>
  typeof value === "string" ? value : fallback;

const numberValue = (value: unknown, fallback = 0) =>
  typeof value === "number" && Number.isFinite(value) ? value : fallback;

export function propertyFromFirestore(
  id: string,
  raw: Record<string, unknown>
): PropertyWithId {
  const rawImages = Array.isArray(raw.images)
    ? raw.images.filter((item): item is string => typeof item === "string")
    : [];
  const legacyImage = stringValue(raw.imageUrl);
  const images = rawImages.length > 0 ? rawImages : legacyImage ? [legacyImage] : [];

  const rawStatus = stringValue(raw.status, "active");
  const status: PropertyStatus = ["active", "draft", "sold", "inactive"].includes(rawStatus)
    ? (rawStatus as PropertyStatus)
    : "active";
  const rawPurpose = stringValue(raw.listingPurpose);
  const searchableTitle = stringValue(raw.title).toLocaleLowerCase("hu-HU");
  const listingPurpose: ListingPurpose = rawPurpose === "rent" || searchableTitle.includes("kiadó") || searchableTitle.includes("kiado") ? "rent" : "sale";

  return {
    id,
    title: stringValue(raw.title),
    city: stringValue(raw.city),
    district: stringValue(raw.district),
    price: numberValue(raw.price),
    propertyType: stringValue(raw.propertyType),
    listingPurpose,
    area: numberValue(raw.area),
    rooms: numberValue(raw.rooms),
    condition: stringValue(raw.condition),
    floor: stringValue(raw.floor),
    balcony: stringValue(raw.balcony),
    parking: stringValue(raw.parking),
    heating: stringValue(raw.heating),
    description: stringValue(raw.description),
    imageUrl: legacyImage || images[0] || "",
    images,
    phone: stringValue(raw.phone),
    email: stringValue(raw.email),
    userId: stringValue(raw.userId),
    featured: raw.featured === true,
    status,
    lat: numberValue(raw.lat, 47.5316),
    lng: numberValue(raw.lng, 21.6273),
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
}
