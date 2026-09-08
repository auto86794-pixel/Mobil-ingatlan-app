# DebrecenHomes – 11. finomítás

- A működő Brevo levelezési integráció változatlan maradt.
- A kiadó hirdetések címkézése javítva.
- Magyar telefonszám-ellenőrzés és egységes `+36` formátum készült.
- A hirdetésleírás `**félkövér**` jelölése formázva jelenik meg.
- Az érdeklődési modal akadálymentessége és háttérgörgetése javítva.
- Elkészült az adatvédelmi és impresszum oldal, footer- és sitemap-hivatkozással.
- A publikus Firestore-olvasás csak aktív hirdetésekre engedélyezett; a tulajdonos és az admin továbbra is látja a saját/jogosult rekordokat.
- A Kedvencek oldal egy törölt vagy inaktív hirdetés miatt már nem dobja el az összes többi mentést.
- A főoldal az aktív kínálatot szerveroldalon tölti, kliensoldali biztonsági visszaeséssel.
- Az Eladó/Kiadó külön adatmező lett az új és szerkesztett hirdetéseknél.
- A Brevo automatikus válasz hibája már nem okoz téves sikertelenséget és dupla érdeklődést.
- A kapcsolatfelvételi API saját domaines és kérésméret-ellenőrzést kapott.
- Firebase CLI konfiguráció került a projektbe, így a Firestore- és Storage-szabályok közvetlenül telepíthetők.
- A regisztrációs megerősítő linket a Firebase Admin hozza létre, a levelet pedig a hitelesített Brevo feladó küldi.
- A szerver naplózza a Brevo sikeres küldésének azonosítóját, így a kézbesítés ellenőrizhető.

## Publikálás előtt kötelező

Az impresszumban ki kell tölteni az üzemeltető hivatalos nevét, székhelyét, adószámát és szükség esetén nyilvántartási számát.
