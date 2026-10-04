# DebrecenHomes – admin fejlesztések

## Elkészült

1. **Módosítási előzmények:** a mentés, státuszváltás, kiemelés, archiválás és tulajdonosátadás megőrzi az előző adatokat, a szerkesztőt és az időpontot. A szerkesztőoldalon az admin visszaállíthat egy korábbi állapotot. A jelenlegi tulajdonos megmarad. Az utolsó 100 bejegyzés látható.
2. **Azonnali frissítés:** a főoldal és a kiemelt ingatlanok, valamint a már megnyitott adatlap követik az adatváltozást. Párhuzamos szerkesztésnél a régi változatra történő mentés hibaüzenetet ad, nem írja felül a másik mentést.
3. **Archiválás:** az ingatlan elrejthető, majd visszaállítható. Az adatok és képek megmaradnak. A kép eltávolítása a szerkesztőből leválasztja a képet, nem törli a tárolt fájlt, így az előzmény visszaállítható.
4. **Érdeklődések:** az új üzenetek privát adminlistába kerülnek. Új, Visszahívás, Megtekintés és Lezárt státusz, belső megjegyzés és megtekintési időpont szerkeszthető. Sikertelen e-mail-értesítés esetén az elmentett érdeklődés megmarad; az ismételt beküldés nem duplázza ugyanazt a kérést.
5. **Kitöltöttség:** az adminlistában százalék és hiányzó mezők jelennek meg az alapterület, szobaszám, telefonszám, kép és ingatlantípus alapján. Külön szűrhető a hiányos lista.
6. **Felhasználókezelés:** adminként letiltás, aktiválás, jogosultságkezelés és végleges fióktörlés érhető el. A törlés előtt látszik az érintett ingatlanlista, átvevő admint kell választani és pontosan beírni az e-mail-címet. Saját fiók és adminfiók közvetlen törlése/letiltása tiltott. Az ingatlanokat előbb átadja a rendszer, csak utána törli a belépési fiókot és profilt. Megszakadt törlés folytatható; nagyobb lista több lépésben halad.

Az előzmények az új verzió élesítésétől keletkeznek. A korábban elveszett m²- és szobaszámadatokat nem állítja helyre. A régi, csak e-mailben létező érdeklődéseket nem importálja.

## Ellenőrzés

- TypeScript ellenőrzés: sikeres.
- 17 automatizált működési teszt: sikeres.
- 5 Firestore/Storage jogosultsági teszt valódi helyi Firebase-emulátoron: sikeres.
- 16 helyi HTTP-ellenőrzés valódi Auth/Firestore SDK-val: sikeres; mentés, előzmény-visszaállítás, archiválás, érdeklődéskezelés, letiltás/aktiválás, törlési védelem és ingatlanátadás.
- Böngészőben: megnyitott adatlap frissült mentés után újratöltés nélkül; előzmény-visszaállítás, archiválás/visszaállítás, érdeklődési megjegyzés/időpont és törlési előnézet működött.
- Lint és produkciós build: sikeres. Megmaradtak a meglévő képelemek és a képgaléria hookfüggőségének figyelmeztetései; ezek nem buildhibák.

A tesztek elkülönített demoadatokkal futottak. Éles felhasználót vagy ingatlant nem töröltünk. A helyi ellenőrzés nem igazolja az éles Firebase szolgáltatási jogosultságokat; az éles adminfolyamatot telepítés után külön ellenőrizni kell.

## Élesítés Windows PowerShellből

### 1. Git és Vercel

```powershell
Set-Location F:\debrecenhomes-app
git add .
git commit -m "Admin kezeles, elozmenyek es archivum"
git push
```

Várd meg a Vercel sikeres, READY telepítését. A meglévő Firebase Admin és Brevo beállítások maradnak használatban; új környezeti változó nincs.

### 2. Firebase szabályok

A Git push és a Vercel telepítés önmagában **nem frissíti** a Firestore és Storage szabályokat. A sikeres alkalmazástelepítés után:

```powershell
Set-Location F:\debrecenhomes-app
firebase.cmd deploy --only firestore:rules,storage --project albi-app-37e9d
```

Ha a CLI nincs bejelentkezve, előbb `firebase.cmd login`. Alternatíva: a Firebase konzolban külön másold be és publikáld a projekt `firestore.rules` és `storage.rules` fájljait.

A Storage szabály a felhasználói profil alapján ellenőrzi a feltöltési jogot. Ha a Firebase kéri a Storage–Firestore kapcsolat engedélyezését, a megfelelő projektben engedélyezd a [Firebase dokumentációban leírt kapcsolatot](https://firebase.google.com/docs/storage/security/rules-conditions). E nélkül a képfeltöltés elutasítható.

### 3. Rövid éles próba

- Jelentkezz be adminnal, nyisd meg az Összes ingatlan kezelése oldalt.
- Egy teszthirdetésen ments visszafordítható módosítást; ellenőrizd a listát, a megnyitott adatlapot és az előzményt.
- Archiváld, majd állítsd vissza ugyanazt a teszthirdetést.
- Küldj egy saját tesztérdeklődést, ellenőrizd az adminlistát és az e-mailt.
- Saját külön tesztfelhasználón próbáld a letiltást/aktiválást. Végleges törlést csak valóban törölhető tesztfiókon végezz; ellenőrizd az átadott ingatlanokat.

## Helyi tesztek újrafuttatása

```powershell
npm.cmd run typecheck
npm.cmd test
npm.cmd run lint
$env:NODE_OPTIONS='--use-system-ca'
npm.cmd run build
```

A jogosultsági tesztekhez Java 21+ és Firebase CLI szükséges. Külön terminálban:

```powershell
firebase.cmd emulators:start --only firestore,auth,storage --project demo-debrecenhomes --config firebase.emulators.json
```

Majd `npm.cmd run test:rules`. Ez a teszt kizárólag a localhost demo-projektjét használja; a demo tesztadatait alaphelyzetbe állítja. A `firebase.emulators.json` az elkülönített helyi teszt konfigurációja, nem éles telepítési konfiguráció.
