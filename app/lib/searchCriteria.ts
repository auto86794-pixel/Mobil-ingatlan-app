export const searchFields = ["listingPurpose", "query", "city", "district", "propertyType", "minPrice", "maxPrice", "minArea", "maxArea", "minRooms", "condition", "parking", "balcony", "heating"] as const;
export function cleanSearchCriteria(input: unknown): Record<string, string> {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new Error("Hiányzó keresési feltételek.");
  const criteria: Record<string, string> = {};
  for (const field of searchFields) {
    const value = (input as Record<string, unknown>)[field];
    if (value === undefined || value === "") continue;
    if (typeof value !== "string" || value.length > 120) throw new Error("Érvénytelen keresési feltételek.");
    const clean = value.trim();
    if (clean) criteria[field] = clean;
  }
  if (criteria.listingPurpose && !["sale", "rent"].includes(criteria.listingPurpose)) throw new Error("Érvénytelen hirdetéstípus.");
  for (const field of ["minPrice", "maxPrice", "minArea", "maxArea", "minRooms"]) {
    if (criteria[field] && (!Number.isFinite(Number(criteria[field])) || Number(criteria[field]) < 0)) throw new Error("Érvénytelen ár vagy méret.");
    if (criteria[field]) criteria[field] = String(Number(criteria[field]));
  }
  for (const [min, max] of [["minPrice", "maxPrice"], ["minArea", "maxArea"]]) {
    if (criteria[min] && criteria[max] && Number(criteria[min]) > Number(criteria[max])) throw new Error("A minimum nem lehet nagyobb a maximumnál.");
  }
  if (!Object.keys(criteria).length) throw new Error("Állíts be legalább egy keresési feltételt.");
  return criteria;
}
export function searchCriteriaMessage(criteria: Record<string, string>): string {
  const labels: Record<string, string> = {listingPurpose:"Hirdetés",query:"Kulcsszó",city:"Város",district:"Városrész",propertyType:"Ingatlantípus",minPrice:"Minimum ár (Ft)",maxPrice:"Maximum ár (Ft)",minArea:"Minimum méret (m²)",maxArea:"Maximum méret (m²)",minRooms:"Minimum szobaszám",condition:"Állapot",parking:"Parkolás",balcony:"Erkély",heating:"Fűtés"};
  return "Keresési igény – személyes kapcsolatfelvételt kérek.\n" + Object.entries(criteria).map(([key,value]) => `${labels[key] || key}: ${value === "sale" ? "Eladó" : value === "rent" ? "Kiadó" : value}`).join("\n");
}
