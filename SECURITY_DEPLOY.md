# DebrecenHomes – Biztonság 2.0 telepítés

A Vercel deploy önmagában **nem publikálja** a Firebase Firestore és Storage szabályokat.
A ZIP feltöltése után ezt a két fájlt külön is publikálni kell a Firebase Console-ban:

1. **Firestore Database → Rules** → másold be a projekt gyökerében lévő `firestore.rules` tartalmát → **Publish**.
2. **Storage → Rules** → másold be a projekt gyökerében lévő `storage.rules` tartalmát → **Publish**.

Ezután teszteld egy új e-mail címmel:
- regisztráció után érkezzen megerősítő levél;
- megerősítés előtt ne lehessen Dashboardot / feltöltést használni;
- a levél linkje után a „Már megerősítettem” gomb engedjen tovább.

A kontakt űrlap most honeypotot és alap IP rate limitet is használ. Ez jó első védelmi réteg, de nagy forgalomnál később érdemes Cloudflare Turnstile vagy tartós, központi rate limiter használata.
