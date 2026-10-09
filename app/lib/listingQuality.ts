import type { Property } from './types';

export function listingQuality(p: Partial<Property>) {
  const checks = [
    { label: 'Ingatlan neve', ok: Boolean(p.title?.trim()) },
    { label: 'Város és városrész', ok: Boolean(p.city?.trim() && p.district?.trim()) },
    { label: 'Ár, alapterület és szobaszám', ok: Number(p.price) > 0 && Number(p.area) > 0 && Number(p.rooms) > 0 },
    { label: 'Legalább 8 fénykép', ok: (p.images?.length || 0) >= 8 },
    { label: 'Részletes leírás (min. 400 karakter)', ok: (p.description?.trim().length || 0) >= 400 },
    { label: 'Állapot és fűtés', ok: Boolean(p.condition?.trim() && p.heating?.trim()) },
    { label: 'Kapcsolattartási adat', ok: Boolean(p.phone?.trim() || p.email?.trim()) },
  ];
  return { score: Math.round(checks.filter(c => c.ok).length / checks.length * 100), missing: checks.filter(c => !c.ok).map(c => c.label) };
}
