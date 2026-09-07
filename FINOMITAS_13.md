# FINOMÍTÁS 13 – adatmodell, Firestore olvasások, SEO

## Elkészült
- Kötelező `listingType` az új hirdetéseknél: `sale` / `rent`.
- Szerkesztésnél külön „Hirdetés típusa” mező.
- Régi hirdetéseknél kompatibilitási fallback: a cím alapján csak akkor következtet, ha a mező még hiányzik.
- A kártyákon külön Eladó / Kiadó jelölés.
- A keresőben külön Eladó / Kiadó szűrő mobilon és asztali nézetben.
- Firestore Rules validálja a `listingType` mezőt; régi dokumentumok szerkeszthetők maradnak.
- A főoldal aktív kínálata szerveroldalon töltődik be és 5 percig cache-elt.
- Megszűnt a főoldali kliensoldali ismételt `posts` lekérés.
- Az ingatlan-adatlap a szerveren már lekért ingatlant adja át a kliensnek, ezért ugyanaz a dokumentum nem töltődik le másodszor.
- A hasonló ingatlanok lekérése maximum 24 aktív dokumentumra korlátozott.
- A Kedvencek oldal nem tölti le többé az összes aktív hirdetést; csak a ténylegesen elmentett dokumentumokat olvassa.
- Admin teljes lekérés szándékosan megmaradt; Dashboard tulajdonos szerint célzott query-t használ.

## Ellenőrzés
- TypeScript: 0 hiba.
- A csomagból szándékosan kimarad: `node_modules`, `.next`, `.git`, `tsconfig.tsbuildinfo`.
- A 11-es és 12-es módosítások is benne vannak.

## Deploy után
A frissített `firestore.rules` tartalmát Firebase Console → Firestore Database → Rules alatt Publish szükséges.
