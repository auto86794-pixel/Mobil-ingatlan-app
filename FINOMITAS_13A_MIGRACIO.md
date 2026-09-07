# FINOMÍTÁS 13A – régi Firestore hirdetések migrációja

Az admin felületre bekerült egy egyszeri migrációs gomb.

A művelet:
- csak a hiányzó `status` mezőt tölti ki `active` értékkel;
- csak a hiányzó `listingType` mezőt tölti ki;
- `listingType = rent`, ha a címben „kiadó” vagy „kiado” szerepel, különben `sale`;
- meglévő `status` vagy `listingType` értéket nem ír felül;
- egyetlen Firestore batch műveletben fut;
- siker után újratölti az admin adatokat.

Használat:
1. deploy,
2. belépés adminnal,
3. /admin,
4. „Migráció indítása”,
5. főoldal ellenőrzése.
