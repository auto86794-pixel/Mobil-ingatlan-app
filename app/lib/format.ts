export function formatPrice(price: number) {
  if (!Number.isFinite(price) || price <= 0) return "Ár egyeztetés szerint";
  if (price >= 1_000_000) {
    const millions = price / 1_000_000;
    const value = Number.isInteger(millions)
      ? millions.toLocaleString("hu-HU")
      : millions.toLocaleString("hu-HU", { maximumFractionDigits: 1 });
    return `${value} M Ft`;
  }
  return `${price.toLocaleString("hu-HU")} Ft`;
}

export function normalizeHungarianPhone(phone?: string): string | null {
  if (!phone) return null;
  const compact = phone.trim().replace(/[\s()./-]/g, "");
  const normalized = compact.startsWith("06") ? `+36${compact.slice(2)}` : compact;
  if (!/^\+36\d{9}$/.test(normalized) || /1234567/.test(normalized)) return null;
  return normalized;
}
