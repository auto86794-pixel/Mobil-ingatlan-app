import { cleanSearchCriteria } from "./searchCriteria";

type SearchInquiry = {
  id: string;
  email?: string;
  kind?: string;
  criteria?: unknown;
  status?: string;
  notes?: string;
  viewingAt?: string;
  createdAt?: string;
};

export function uniqueInquiries<T extends SearchInquiry>(items: T[]): T[] {
  const byId = new Map(items.map(item => [item.id, item]));
  const seen = new Set<string>();
  return [...byId.values()]
    .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
    .filter(item => {
      if (item.kind !== "search" && !item.id.startsWith("legacy_")) return true;
      if (!item.email?.trim()) return true;
      try {
        const input = typeof item.criteria === "string" ? JSON.parse(item.criteria) : item.criteria;
        const criteria = cleanSearchCriteria(input);
        // Keep independently managed records visible; never discard notes or appointments.
        const key = JSON.stringify([item.email.trim().toLowerCase(), criteria,
          item.status || "new", item.notes || "", item.viewingAt || ""]);
        if (seen.has(key)) return false;
        seen.add(key);
      } catch { /* Malformed historical records must remain accessible. */ }
      return true;
    });
}
