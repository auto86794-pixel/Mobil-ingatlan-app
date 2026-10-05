# Debreceni Otthonok – arculat és későbbi domainváltás

Az új név, logó és arculat elkészült. A meglévő Firebase-projekt, hirdetések, jogosultságok és kapcsolati e-mail-címek megmaradnak.

## Most
Külön mappában próbáld ki az új változatot a HELYI-INDITAS.md szerint. A domainbeállítást egyelőre nem kell módosítani. A canonical, sitemap és bejelentkezési levelek még a debrecenhomes.hu domainre mutatnak.

## Amikor az új domain aktív
1. Vercelben add hozzá a debreceniotthonok.hu és www.debreceniotthonok.hu domaint, állítsd be a Vercel által megadott DNS-rekordokat.
2. Firebase Authentication → Settings → Authorized domains: add hozzá az új domaineket.
3. Vercelben állítsd be a NEXT_PUBLIC_SITE_URL=https://debreceniotthonok.hu környezeti változót, és végezz új deployt.
4. Ellenőrizd a belépést, jelszó-visszaállítást, e-mail-megerősítést, érdeklődési űrlapot, ingatlanoldalakat, sitemap.xml és robots.txt tartalmát.
5. A régi domainről állíts be 301-es átirányítást az újra úgy, hogy az útvonal és a query paraméterek megmaradjanak. Az átirányítás ebben a csomagban még nincs bekapcsolva.
6. Search Console: az új domain ellenőrzése, sitemap beküldése, majd címváltoztatás a régi tulajdonból.

Az új e-mail-címeket csak működő postafiók és hitelesített levélküldés után cseréld le.

