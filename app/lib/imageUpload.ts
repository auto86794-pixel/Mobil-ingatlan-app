export const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024;
export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

export function validateImageFile(file: File): string | null {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type as (typeof ALLOWED_IMAGE_TYPES)[number])) {
    return `A(z) ${file.name} nem támogatott képformátum. JPG, PNG vagy WEBP tölthető fel.`;
  }

  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    return `A(z) ${file.name} túl nagy. Egy kép legfeljebb 10 MB lehet.`;
  }

  return null;
}

export function createSafeImageName(file: File): string {
  const extension = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
  return `${Date.now()}-${crypto.randomUUID()}.${extension}`;
}
