import type { Property } from './types';
export function listingQuality(p: Partial<Property>) {
 const checks = [
  {label:'alapterület',ok:Number(p.area)>0},
  {label:'szobaszám',ok:Number(p.rooms)>0},
  {label:'telefonszám',ok:Boolean(p.phone?.trim())},
  {label:'kép',ok:Boolean(p.imageUrl?.trim() || p.images?.some(image=>image.trim()))},
  {label:'ingatlantípus',ok:Boolean(p.propertyType?.trim())},
 ];
 const suggestions = [
  new Set([p.imageUrl,...(p.images || [])].filter(Boolean)).size < 8 ? 'Legalább 8 különböző fénykép' : '',
  (p.description?.trim().length || 0) < 400 ? 'Részletes leírás (legalább 400 karakter)' : '',
  !p.condition?.trim() || !p.heating?.trim() ? 'Állapot és fűtés megadása' : '',
 ].filter(Boolean);
 return {score:Math.round(checks.filter(c=>c.ok).length/checks.length*100),missing:checks.filter(c=>!c.ok).map(c=>c.label),suggestions};
}
