# FINOMÍTÁS 12 — Contact / Brevo stabilitás

Ez a csomag a 11-es csomag UTÁN alkalmazandó.

## Javítások

- A tulajdonosi értesítés és az automatikus visszaigazolás külön hibakezelést kapott.
- Ha a tulajdonosi értesítés sikeres, de az automatikus válasz hibázik, az API továbbra is sikeres beküldést ad vissza. Így nem ösztönzi a felhasználót ugyanannak az érdeklődésnek az újbóli elküldésére.
- Szerveroldali validálás erősítve: név, e-mail, telefonszám, üzenet és hirdetésazonosító.
- A kliens által küldött propertyUrl nincs megbízható adatként felhasználva; az ingatlanlinket a szerver állítja elő a propertyId-ből.
- A honeypot ellenőrzés a rate limit elé került, így az egyszerű botok nem fogyasztják a normál felhasználók limitjét.
- Brevo kérés 12 másodperces timeoutot kapott.
- API válaszok no-store cache fejléccel mennek.
- A Brevo/Contact logolás request ID-t kapott, személyes adatok naplózása nélkül.
- A jelenlegi memóriás rate limit megmaradt best-effort védelemként.

## Fontos

A megosztott/tartós rate limit és a Cloudflare Turnstile külön külső szolgáltatás-beállítást igényel. Ezeket nem kapcsoltam be vakon, mert kulcsok nélkül az éles kapcsolatfelvétel leállna. A mostani csomag biztonságosan telepíthető a jelenlegi Vercel/Brevo konfigurációra.

## Ellenőrzés

- `npm run typecheck`: 0 hiba.
- A helyi Linux production build a forráskódtól függetlenül azért nem tudott lefutni, mert a Windowsról csomagolt node_modules nem tartalmazza a Linuxos Next SWC binárist, és az ellenőrző környezet nem ér el npm registryt.
