# Debreceni Otthonok – a látványterv szerinti változat

## Önálló helyi kipróbálás
1. Csomagold ki ezt a ZIP-et egy ÚJ, külön mappába, például debreceni-otthonok-latvanyterv néven. A jelenlegi projektet ne írd felül.
2. VS Code-ban nyisd meg az új mappát. A terminál legyen abban a mappában, ahol a package.json van.
3. Futtasd: npm ci
4. Futtasd: npm run dev -- --port 3002
5. Nyisd meg: http://localhost:3002

Node.js 20 vagy 22 szükséges a projekt beállítása szerint. A Firebase-kapcsolat az eredeti projekté, ezért a meglévő valódi ingatlanok jelennek meg. A helyi példányból végzett mentések is a meglévő adatbázisba kerülnek. A külső képekhez és adatokhoz internetkapcsolat szükséges. Titkos környezeti változó nincs a ZIP-ben; a szerveroldali adminisztrációhoz és e-mail-küldéshez a meglévő projekt környezeti beállításai szükségesek.

## Elkészült
Teljes szélességű Nagytemplom-főképes rész, nagy fehér serif cím, ráhelyezett keresősáv, Eladó/Kiadó szűrés, városrészmenü, öt előny, négyoszlopos kompakt kártyák, városbemutató légi képpel, mobilon tördelődő kereső és kártyák.

A két háttérillusztráció az imagegen beépített eszközével készült a jóváhagyott látványterv alapján. A főképnél a kérés: a felső Nagytemplom-jelenet rekonstruálása minden felirat és felületi elem nélkül; a városképnél: az alsó bal oldali légi Debrecen-jelenet rekonstruálása felirat és kezelőelem nélkül.

A mintaképen szereplő fiktív ingatlanok helyén a valódi adatbázis kínálata szerepel. A gombok zöldek a korábbi kérés szerint; a címkék és kiemelések aranyszínűek. Az érdeklődési és telefonos funkciók megmaradtak.

## Ellenőrzés
TypeScript ellenőrzés sikeres; 21/21 meglévő teszt sikeres; kiadási build sikeres. Böngészőben 1440 és 390 px szélességen nincs vízszintes kifutás, a mobilmenü és a Kiadó kapcsoló működik. A külső hirdetésfotók betöltését ebben a környezetben nem lehetett megbízhatóan igazolni. A meglévő kép- és hook-lint figyelmeztetések maradtak.

A domain nincs átkapcsolva. A későbbi váltás lépéseit a MARKAVALTAS.md tartalmazza.

## Kiválasztott logó
A 2-es változat: arany körív, mélyzöld ház, arany ablak. A fejlécben 48 px, mobilon 40 px. A böngészőikon is ezt a motívumot használja.

## Kiválasztott logó
A 2-es változat: arany körív, mélyzöld ház, arany ablak. A fejlécben 48 px, mobilon 40 px. A böngészőikon is ezt a motívumot használja.
