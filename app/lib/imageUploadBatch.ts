export const MAX_PROPERTY_IMAGES = 12;
export async function uploadImageBatch(
  files: File[], existingCount: number,
  validate: (file: File) => string | null,
  upload: (file: File) => Promise<string>,
  onUploaded: (url: string) => void,
): Promise<string[]> {
  if (existingCount + files.length > MAX_PROPERTY_IMAGES)
    return [`Legfeljebb ${MAX_PROPERTY_IMAGES} kép adható meg. Jelenleg ${existingCount} kép van az adatlapon.`];
  const invalid = files.map(validate).filter((message): message is string => Boolean(message));
  if (invalid.length) return invalid;
  const errors: string[] = [];
  for (const file of files) {
    try { onUploaded(await upload(file)); }
    catch { errors.push(`Nem sikerült feltölteni: ${file.name}. Ezt a képet válaszd ki újra.`); }
  }
  return errors;
}
