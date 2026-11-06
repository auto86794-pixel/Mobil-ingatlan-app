# HomeFlow CRM – 6.1: weboldali érdeklődőfogadás

## Valódi hirdetéses próba: sikeres – 2026. november 6.

- Aktív hirdetés: `i3T6re7x9ytHkuYWK0mj`, „Családi otthon saját kerttel, terasszal és napelemmel Debrecen Csapókertben!”.
- A nyilvános böngészőűrlapból elküldött `HF-V6-20261106-01` jelölésű, egyértelmű rendszerellenőrzési üzenetre sikeres visszajelzés jelent meg.
- Az éles Supabase-ból visszaolvasva: completed import, ügyfél, hozzá kapcsolt todo visszahívási feladat, helyes hirdetéscím és hivatkozás, teljes üzenet, 1 idővonalbejegyzés.
- A határidő 2026. november 7. 10:00 Europe/Budapest szerint.
- Azonos beküldésazonosítóval és tartalommal a valódi `/api/contact` ismételten 200 / success választ adott. Utána pontosan **1 import, 1 ügyfél, 1 tesztfeladat és 1 idővonalbejegyzés** tartozott a próbához.
- A felhasználó a saját postaládájában visszaigazolta a „Megkaptuk az érdeklődésed” levél megérkezését. A postafiókba nem léptünk be, jelszót nem kértünk.
- A csak erre a próbára létrejött ügyfél test besorolást kapott; a visszahívási feladat cancelled állapotba került, hogy ne szerepeljen valódi teendőként. Bejegyzést nem töröltünk, régi ügyfelet vagy hirdetést nem módosítottunk.
- Ezzel a hirdetéses érdeklődőfogadás valódi mentési, duplikációs és visszaigazoló e-mail-próbája lezárt. A landing külön teljes űrlapos/mailbox-próbája nem része ennek az egyhirdetéses ellenőrzésnek.

## Éles kiadás: kész

Mindhárom projekt Production / READY állapotban telepítve:

| Projekt | Nyilvános cím | Kiadási azonosító | Forráscommit |
| --- | --- | --- | --- |
| HomeFlow | https://www.homeflowcrm.hu | dpl_EXTTx8Ef9zyfXURkNzfSqyrQJzcH | 0b80149 |
| Ingatlanos alkalmazás | https://debrecenhomes.hu | dpl_31NLqTovpYLGQcZQw6TFrEynGhoh | 2d4ab55 |
| Bemutatkozó oldal | https://www.debreceniotthonok.hu | dpl_4jbFkswdEtj2x9ErkUf9m32aH3y7 | 6270529 |

A három forráscommit a felhasználó külön engedélyével a megfelelő GitHub main ágra feltöltve. A titkok csak a kiadási folyamat memóriájában és a Vercel Production beállításaiban szerepeltek; fájlba vagy forráskódba nem kerültek.

Kiadáskori ellenőrzés: CRM és landing-inbox titok nélkül 401, megfelelő titokkal érvénytelen bemenetre 400; landing botcsapda 200, nyitóoldal 200. A visszagörgetett SQL-próba az éles sémán sikeres; meglévő ügyféladatok ellenőrzőösszege változatlan. A kiadáskori műszaki próbákat később a fent rögzített valódi hirdetéses és e-mailes próba egészítette ki.

A régi ügyfél- és hirdetésállomány átvétele nem része a kiadásnak. A következő új érdeklődések tartós admin-bejegyzésből jutnak a HomeFlow-ba.

A felhasználó engedélyezte az élesítést mindkét weboldal új érdeklődéseire. Külön tisztázta: a meglévő ügyfeleket és a 37 hirdetést (közülük a felhasználó szerint 32 aktív) nem kell importálni. A régi állomány eltérő darabszáma ezért nem kiadási akadály; automatikus visszamenőleges import nincs.

## Éles előellenőrzés és adatmegőrzés

- A HomeFlow helyi konfigurációja és az élő `www.homeflowcrm.hu/login` publikus JavaScriptje egyaránt a `wzadklxehpldztuluoul` Supabase-projektre mutat.
- Ez a projekt szüneteltetve volt. A meglévő projektet a Supabase Resume műveletével újraindítottuk. A felület a helyreállítás befejezését visszaigazolta.
- A helyreállítás futása közben átmenetileg hiányzó táblák látszottak; ezt nem tekintjük végleges adatvesztési bizonyítéknak.
- A befejezett helyreállítás után, `postgres` adatbázisban és `postgres` szereppel futó pontos COUNT lekérdezés: **1 ügyfél, 1 feladat, 2 ügy**. A felhasználó tisztázta, hogy a weboldali meglévő ügyfelek átvétele nem cél; csak az új érdeklődések érkezzenek át.
- Az ügyfélállomány lekérdezett fingerprintje: `5e0ba8076be26d633a086b2a7fd952c3`. Ez ellenőrzőösszeg, nem mentés.
- A `clients`, `tasks` és `timeline_events` oszlopai olvasással ellenőrizve; a `website_lead_imports` még nem létezik ebben a projektben.
- Az új fogadási tábla és függvény először az éles sémán, visszagörgetett tranzakcióban sikeresen lefutott. Ezt követően a séma alkalmazva; a meglévő ügyfélszám **1**, fingerprintje változatlanul `5e0ba8076be26d633a086b2a7fd952c3`. A próbaügyfél nem maradt meg. Ügyfélimport, törlés és tömeges átírás nem történt.

## Ellenőrzött kiadási célpontok – 2026. november 6.

- HomeFlow: `homeflow-crm`, `https://www.homeflowcrm.hu`, helyi forrás `C:\Users\wingo\homeflow-crm`.
- Ingatlanos alkalmazás: `mobil-ingatlan-app`, `https://debrecenhomes.hu`, helyi forrás `F:\debrecenhomes-app`. Az itt elkészült tartós továbbítás és admin újrapróbálás ezt a projektet érinti.
- Külön bemutatkozó oldal: `debreceni-otthonok`, `https://www.debreceniotthonok.hu`, helyi forrás `F:\debreceni-otthonok`. A helyi `/api/lead` már a közös adminlistába ment, majd a meglévő Resend-értesítést küldi. Nem szabad a Next.js alkalmazást erre a projektre telepíteni.
- Mindhárom helyi mappa a megfelelő Vercel-projekthez kapcsolva, külön `project inspect` ellenőrzéssel. A szükséges Production integrációs változók beállítva.
- A felhasználó mindkét forrást választotta. A HomeFlow-fogadó külön rögzíti a két forrásnevet.
- A Supabase connector és CLI helyett a felhasználó által bejelentkeztetett böngészőben történt a projekt- és sémaellenőrzés, majd a tesztelt új séma alkalmazása. A telepítés Vercel CLI-vel történt.

## Elkészült helyben

- A weboldal a tartósan elmentett érdeklődést továbbítja a HomeFlow-nak, az e-mail-küldéstől függetlenül.
- Az admin érdeklődési kártyája külön mutatja a CRM-átvételt; a hibás vagy félbeszakadt küldés újrapróbálható. A régi rekordok csak kézi újrapróbálással kerülnek át, tömeges visszamenőleges import nincs.
- A HomeFlow végpont saját, szerveroldali megosztott titokkal hitelesít. A proxy csak a pontos `/api/website-lead` útvonalat engedi a végpont saját hitelesítéséhez.
- Az ügyfél, a közvetlen ügyfélhez kapcsolt visszahívási feladat, az idővonalbejegyzés és a feldolgozási nyugta egy PostgreSQL-tranzakcióban készül.
- Meglévő ügyfélhez új feladat kapcsolódik; neve, elérhetőségei és keresési preferenciái nem íródnak felül. Új vevői ügy nem keletkezik automatikusan.
- Az üzenet, a weboldali hirdetés azonosítója és hivatkozása megmarad. A Firebase-hirdetésazonosító nem kerül CRM-ingatlan UUID mezőbe.
- A határidő az eredeti beérkezést követő nap 10:00, Europe/Budapest szerint. Visszamenőleges kézi továbbítás ezért lejárt feladatot is eredményezhet.
- Több egyező ügyfél, archivált egyezés, eltérő tartalmú ismétlés vagy korábbi félbemaradt import esetén kézi ellenőrzési állapot jelenik meg; nincs automatikus összevonás vagy törlés.

## Források

Weboldal: `F:\debrecenhomes-app`.

HomeFlow: `C:\Users\wingo\homeflow-crm`.

A `website-lead-route.ts.txt` és `website-lead-atomic.sql` átadási másolatok; tartalmuk megegyezik a HomeFlow végpontjával, illetve a `20261105231137_website_lead_atomic_intake.sql` migrációval. A `.txt` végződés megelőzi, hogy a weboldal TypeScript-fordítója a másik projekt importjait fordítsa.

## Ellenőrzési eredmény

- Weboldal: 43/43 automatikus teszt; típusellenőrzés és produkciós build sikeres. A legutóbbi build a Windows tanúsítványtárával futott, meglévő kép/hook figyelmeztetésekkel. Ez nem éles adatkapcsolati bizonyíték.
- Landing: helyi build sikeres; a küldő → védett inbox → tartós tárolás → értesítés útvonal szimulált hálózattal ellenőrizve. A levélküldés hibája nem veszíti el a mentett érdeklődést; sikertelen tartós mentésre a felhasználó nem kap sikerüzenetet. Ismétlésnél a már visszaigazolt levél nem küldődik újra.
- HomeFlow: 55/55 meglévő automatikus teszt, a módosított proxy és fogadó végpont lintellenőrzése, típusellenőrzés és produkciós build sikeres.
- Elkülönített PGlite/PostgreSQL szerződésteszt: 169 szintetikus ügyfél változatlan; új és meglévő ügyfél, ismételt kérés, megváltozott tartalom, teljes rollback és újrapróbálás, bizonytalan/archivált egyezés, régi feldolgozási nyugta és végrehajtási jogosultság ellenőrizve.
- Összekapcsolt helyi próba: a valódi küldő és fogadó kód a helyi PostgreSQL-függvényt hívja; COMMIT után elveszített HTTP-válasz, majd az admin végponton újrapróbálás esetén pontosan egy ügyfél és feladat marad. A Firestore és a hálózati kapcsolat tesztadapter, a fogadó és az SQL valódi. Külön teszt védi a frissebb sikeres állapotot egy korábbi kérés késői hibájától.
- Mobilos böngészőteszt: 390 px szélesség; valódi React-komponens, szimulált admin API. A gomb a megfelelő végpontot hívta, a visszaigazolt állapot megjelent, a megjegyzés megmaradt, nem volt vízszintes túlcsordulás vagy böngészőoldali kivétel. Képek: `mobile-crm-retry.png`, `mobile-crm-sent.png`.
- Nem ellenőrzött: az éles adatbázis teljes sémája, a tényleges 169 ügyfél állapota, a produkciós környezeti változók, valódi e-mail és hitelesített éles mentés. A helyi SQL-teszt a szükséges táblák tesztsémájával futott; több adatbázis-kapcsolatos párhuzamossági teszt még nincs.

Futtatás:

```powershell
npm.cmd test
npm.cmd run typecheck
npm.cmd run build
# Elkülönített PostgreSQL-tesztmotor, nem alkalmazásfüggőség:
$env:NODE_OPTIONS='--use-system-ca'
npm.cmd install --prefix .tmp/homeflow-validation --no-package-lock --no-audit --no-fund @electric-sql/pglite@0.3.14
npm.cmd run test:homeflow:db
# A böngészőteszt a HomeFlow Playwright-csomagját és a telepített Edge-et használja:
npm.cmd run test:homeflow:ui
```

## Éles bevezetés sorrendje

1. A megfelelő Supabase projekt és jelenlegi séma ellenőrzése; a tényleges ügyfélszám, kapcsolatok, mentés és visszaállítási pont rögzítése. Az éles adatokat ez a munka nem módosította.
2. Elkülönített tesztkörnyezetben ellenőrizni a két migrációt a tényleges sémával, a meglévő triggerekkel és jogosultságokkal.
3. A korábbi `20261105230000_website_lead_imports.sql`, majd az új `20261105231137_website_lead_atomic_intake.sql` alkalmazása, ha még nincsenek alkalmazva. A korábbi `processing` rekordokat kézzel ellenőrizni, nem törölni.
4. HomeFlow szerver: `WEBSITE_LEAD_SECRET` és a meglévő szerveroldali Supabase secret/service-role kulcs beállítása. Weboldal szerver: `HOMEFLOW_CRM_URL` (HTTPS), `HOMEFLOW_LEAD_SECRET` (ugyanaz a megosztott titok), valamint `LANDING_LEAD_SECRET`. Landing szerver: `LEAD_INBOX_URL` (a debrecenhomes.hu `/api/integrations/landing-lead` végpontja), `LANDING_LEAD_SECRET` (a weboldallal azonos). Titok nem kerülhet `NEXT_PUBLIC_` változóba, klienskódba vagy dokumentumba.
5. Előbb a HomeFlow, majd a weboldal telepítése. A külső main ágra push külön jóváhagyást igényel a korábbi munkamegállapodás szerint.
6. Egy egyértelműen jelölt kontroll-érdeklődés beküldése saját ellenőrzött elérhetőséggel. Az ügyfél, feladat, idővonal, importnyugta, weboldali CRM-állapot és a tényleges mailbox külön ellenőrzendő. Az ismételt továbbítás ugyanazt a feladatot adja vissza.
7. Meglévő ügyféllel, átmeneti elérhetetlenséggel és újrapróbálással megismételni; mobilon ügyféladatlap/feladat/naptár, valamint a korábbi ügy- és párosítási munkafolyamat ellenőrzése.

Helyi előfeltétel-ellenőrzéskor az integráció három változója és a HomeFlow szerveroldali Supabase-kulcsa hiányzott a `.env.local` fájlokból. Ez nem bizonyítja a Vercel éles beállításainak hiányát. A Supabase connector ebben a munkamenetben nem volt elérhető (`list_projects` és `search_docs`: not available).

## Leállítás / visszaállítás

A weboldal szerveroldali `HOMEFLOW_CRM_URL` vagy `HOMEFLOW_LEAD_SECRET` változójának eltávolításával és újratelepítéssel a CRM-továbbítás leállítható. Az érdeklődések továbbra is megmaradnak a weboldalon; az e-mail külön működik. A hozzáadott adatbázismezők és nyugták megőrizhetők. Meglévő ügyféladatot vagy importnaplót visszaállítás címén ne töröljünk.

Adatbázisfüggvény-jogosultságokhoz ellenőrzött referencia: https://supabase.com/docs/guides/database/functions
