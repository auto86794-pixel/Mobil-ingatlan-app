# Képgaléria sorrendezés – 2026.11.11.

A feltöltő és szerkesztő oldalon közös képrendező jelenik meg.
- Asztali gépen a képek húzással rendezhetők.
- Mobilon és billentyűzettel az Előrébb / Hátrébb gombok használhatók.
- Az első kép a borító; a Borítónak gomb az első helyre mozgat.
- A sorrend az Ingatlan mentése / Módosítások mentése gombbal véglegesíthető.
- Feltöltés és mentés közben a képműveletek le vannak tiltva.

Teljes projektcsomag: a meglévő projektbe másolható. A saját .env fájlt őrizd meg.
Módosított fájlok: app/create/page.tsx, app/edit/[id]/page.tsx.
Új fájl: app/components/property/SortableImageGallery.tsx.

Ellenőrzés: TypeScript sikeres, 49/49 meglévő teszt sikeres, production build sikeres.
Külön komponens-eseményellenőrzés: rendezőgombok, borítóválasztás, drag/drop,
zárolás, törlés sikeres. A valódi böngészős és Firebase-mentési próba nem történt meg.
A build figyelmeztetéseket jelez img használatra és egy meglévő galéria-effekt függőségeire.
