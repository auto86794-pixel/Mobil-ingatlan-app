import { NextResponse } from 'next/server';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getAdminAuth } from '@/app/lib/firebaseAdmin';
const fields = ['listingPurpose','query','city','district','propertyType','minPrice','maxPrice','minArea','maxArea','minRooms','condition','parking','balcony','heating'];
export async function POST(request: Request) {
 try {
  const body = await request.json();
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254 || body.consent !== true) return NextResponse.json({error:'Érvényes e-mail és hozzájárulás szükséges.'},{status:400});
  if (!body.criteria || typeof body.criteria !== 'object' || Array.isArray(body.criteria)) return NextResponse.json({error:'Hiányzó keresési feltételek.'},{status:400});
  const criteria:Record<string,string>={};for(const key of fields){const value=body.criteria[key];if(typeof value==='string')criteria[key]=value.slice(0,120)}
  getAdminAuth(); // Admin konfiguráció ellenőrzése; a Firestore ugyanahhoz az apphoz kapcsolódik.
  await getFirestore().collection('searchAlerts').add({email,criteria,consent:true,consentAt:FieldValue.serverTimestamp(),createdAt:FieldValue.serverTimestamp(),status:'pending',source:'debrecenhomes'});
  return NextResponse.json({ok:true});
 } catch {return NextResponse.json({error:'A mentés most nem érhető el. Próbáld újra később.'},{status:503})}
}
