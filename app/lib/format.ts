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
