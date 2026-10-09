# Debrecen Homes – egységesítés, 2026.10.09.

A csomag a legutóbbi debrecenhomes-fejlesztes-1-3.zip teljes forrását tartalmazza, a meglévő projekt javításaival.

## Javított működés

- A kitöltöttség százalékát az admin, a hirdetésfeladás és a szerkesztés ugyanabból az öt alapfeltételből számolja. A részletesebb leírás, több fotó, állapot és fűtés külön javaslat marad.
- A feladás és a szerkesztés ugyanazt a cleanPropertyPatch adatellenőrzést használja az írás előtt. A feladás meglévő kliensoldali Firebase-mentése és a szerkesztés meglévő szerveroldali API-ja megmaradt; ezek jogosultságait a már meglévő Firestore-szabályok kezelik.
- A főoldali és az adatlapos keresésiigény-rögzítés ugyanazt az űrlapot és szerveroldali folyamatot használja. Az új igények a meglévő inquiries gyűjteményben jelennek meg. Az azonos e-mail és azonos feltételek ismételt beküldése nem hoz létre új igényt.
- Az admin a régi searchAlerts rekordokat is megjeleníti és szerkeszti, külön adatmásolás nélkül. Újraküldésük sem hoz létre második igényt. A régi és új listák önálló lapozással tölthetők tovább, közös felületen.
- A keresési feltételek mentés előtt láthatók. Üres, hibás vagy fordított ár/méret-intervallum nem menthető.
- A kedvencek minden felületen közös mentési/törlési segédfüggvényt használnak. Egy felhasználó–ingatlan pár egy állandó dokumentumazonosítót kap. A korábbi ismétlődő rekordokat az adott kedvenc mentése/törlése összevonja; nincs tömeges adatbázis-takarítás.
- A számmá alakított és Firebase-dátumok kezelése közös: első betöltéskor is helyes a dátumfeldolgozás.
- Az ajánló azonos hirdetési cél, város és típus mellett legfeljebb 35%-os ár- és méreteltérést enged. Nincs automatikus alappont pusztán az eladó/kiadó egyezésre.
- A kifejezetten beállított eladó/kiadó érték elsőbbséget kap a cím alapján történő régi felismeréssel szemben.
- Az admin fölösleges egyszeri ingatlanlista-lekérése megszűnt; a meglévő élő lista maradt.
- A levélküldés közös Brevo-segédfüggvényt használ. A megerősítő és jelszó-visszaállító levelek közös, szerveroldali korlátozást használnak, külön műveleti kerettel.

## Ellenőrzés

- npm run typecheck: sikeres.
- npm test: 30 sikeres teszt. Jogosultságok, verzióütközés, előzmények, érdeklődésmentés, keresésiigény-duplikáció, korábbi igények kezelése, kedvencek összevonása, közös kitöltöttség, dátumkezelés és megerősítő levél ismételt küldése.
- npm run build: sikeres. A meglévő img optimalizálási és galériás hook figyelmeztetések megmaradtak; nincs buildhiba.
- A tesztek helyi, szimulált adatbázissal/levélküldéssel futottak. Éles Firebase írás, élő e-mail-kézbesítés, szabályemulátor és kézi mobilböngészős ellenőrzés nem történt.
- A környezet Node 24-et használt; a projekt támogatott Node-verziója továbbra is 20–22, ezért a saját gépen is fusson a lent megadott ellenőrzés.

## Telepítés

1. Készíts másolatot a jelenlegi F:\debrecenhomes-app mappáról.
2. A ZIP tartalmát másold a meglévő projekt gyökerébe, a fájlok felülírásával. A saját .env.local fájlodat tartsd meg.
3. PowerShell:

```powershell
cd F:\debrecenhomes-app
npm install
npm run typecheck
npm test
npm run build
```

Ez a javítás nem igényel új környezeti változót vagy Firebase-szabály-módosítást. A korábbi FIREBASE_ADMIN és BREVO beállításokat használja.

Az automatikus újingatlan-értesítés továbbra sincs bekapcsolva. A keresési igényeket az admin kezeli, megfelelő ajánlat esetén személyes megkereséssel. A meglévő Brevo beállításokkal a mentésről visszaigazolás és üzemeltetői értesítés készül; levélküldési hiba esetén az igény az adminban megmarad.
