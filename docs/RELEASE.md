# Store release guide

Status on 2026-09-06: app complete, push working, universal links configured. Identifiers: iOS `net.stg-sz.app` (Apple Team DAJ8YV54YV), Android `net.stgsz.app`, EAS project `@gereonelvers/stg-schuelerzeitung`.

## 1. Accounts

- **Apple Developer** – active. App Store Connect app record still to be created (EAS does this on first submit).
- **Google Play** – new developer account needed ($25 once, identity verification). New *personal* accounts must run a **closed test with at least 12 testers for 14 days** before they can apply for production access; plan for that delay. Organisation accounts (e.g. registered to the school) skip this.
- Both stores ask whether you are a "trader" under the EU Digital Services Act: a non-commercial school newspaper is **not** a trader.

## 2. Builds

EAS Build free plan: 15 iOS + 15 Android cloud builds per month. Local builds also work (`eas build --local`).

```sh
cd mobile
npx eas-cli build -p ios --profile production        # first run: log in with the Apple ID, EAS creates the distribution certificate + App Store profile
npx eas-cli build -p android --profile production    # uses the keystore already stored in EAS
```

Local alternatives: `npx eas-cli build -p android --profile production --local --output dist/app.aab` (verified working); iOS local production builds need the distribution certificate, which EAS creates during the first cloud build.

Versioning: `expo.version` in app.json is the marketing version (2.0.0); build numbers are managed by EAS (`appVersionSource: remote`, auto-increment on production builds).

## 3. Submit

```sh
npx eas-cli submit -p ios --latest      # Apple ID login or an App Store Connect API key; creates the App Store Connect record if missing
npx eas-cli submit -p android --latest  # needs play-service-account.json (see below) and the app created once manually in Play Console
```

Google Play service account (already created on the Cloud side, 2026-09-06): `play-publisher@stg-schuelerzeitung.iam.gserviceaccount.com`, key saved as `mobile/play-service-account.json` (git-ignored), Android Publisher API enabled. The Play developer account `gereonelvers@gmail.com` has the Editor role on the Cloud project so it can be linked under Play Console → Setup → API access if wanted; linking is optional. What must be done in the Play Console UI:

1. Create the app (name "STG Schülerzeitung", German, App, Free).
2. Users and permissions → Invite new users → e-mail `play-publisher@stg-schuelerzeitung.iam.gserviceaccount.com` → app permissions: "Release to testing tracks", "Manage testing tracks and edit tester lists", "Manage production releases", "View app information".
3. Testing → Internal testing → Create new release → upload `mobile/dist/stg-schuelerzeitung-release.aab` by hand (Google requires the first upload to be manual). Later releases: `npx eas-cli submit -p android --latest`.
4. Fill in the store listing, Data safety, content rating, target audience (13+ is the safe choice: no child-directed content), News app declaration.

New personal Play accounts must run a closed test with ≥12 testers for 14 days before production access can be requested; the internal/closed track is where the school can test in the meantime.

## 3b. Shipping an update

1. Bump `expo.version` in `mobile/app.json` (2.0.1 shipped the comment/keyboard fixes on 2026-09-06) and commit.
2. Build both platforms in the cloud (EAS assigns the next build number / versionCode itself):
   `npx eas-cli build -p ios --profile production --non-interactive` and the same with `-p android`.
3. Submit: `npx eas-cli submit -p ios --latest --non-interactive` (App Store Connect API key stored on EAS, `ascAppId` 6809216983 in eas.json) and `npx eas-cli submit -p android --latest --non-interactive` (internal track via play-service-account.json; promote in Play Console).
4. TestFlight processes the build within ~10 minutes; Play's internal track is immediate for testers already on the list.

## 4. Store listing (German)

**Name:** STG Schülerzeitung
**Subtitle (iOS, 30 chars):** Schüler texten Gedanken
**Short description (Play, 80 chars):** Die Schülerzeitung des Städtischen Gymnasiums Bad Segeberg – Artikel, Ressorts, Redaktion.
**Keywords (iOS, 100 chars):** Schülerzeitung,STG,Bad Segeberg,Schule,Gymnasium,Zeitung,Nachrichten,Schüler,Segeberg
**Category:** News (iOS) / News & Magazines (Play). Alternative: Education.
**Age rating:** 4+ / Everyone (no user-generated content that is unmoderated: comments are pre-moderated and e-mail-verified).

**Description:**

Die App der Schülerzeitung des Städtischen Gymnasiums Bad Segeberg. Von Schüler:innen gemacht, für alle, die wissen wollen, was am STG los ist.

• Alle Artikel aus über 20 Ressorts: Schule, Wissen, Kultur, Sport, Interviews, Gaming, Politik und mehr
• Neue Artikel sofort per Mitteilung – auf Wunsch nur für deine Lieblingsressorts
• Artikel merken und offline lesen, zum Beispiel auf der Bahnfahrt
• Kommentieren und mitdiskutieren – freundlich und mit echtem Namen
• Die Redaktion kennenlernen: Wer schreibt eigentlich was?
• Suche, Bilder-Galerien, Videos, dunkler Modus, einstellbare Textgröße

Die Schülerzeitung erscheint seit 2018 online auf stg-sz.net. Alle Texte stammen von Schüler:innen des STG.

**What's new (2.0.0):** Komplett neue App für iOS und Android: neues Design, Mitteilungen bei neuen Artikeln, Lesezeichen, Offline-Lesen, Kommentare und Suche.

## 5. Privacy answers

Data the app processes:
| Data | Purpose | Linked to identity? | Where |
|---|---|---|---|
| Push token + chosen Ressorts | Notifications (only if enabled) | No | stg-sz.net (WordPress DB), Expo push service |
| Random install id | Count article views once per day | No | stg-sz.net |
| Name + e-mail when commenting | Comment display / verification | Yes (user-provided) | stg-sz.net (WordPress comments) |
| Bookmarks, settings, cache | App features | No | Only on the device |

No advertising, no tracking SDKs, no analytics beyond the view counter. Third parties: Expo (push relay), Apple/Google (push delivery), Cloudflare (site CDN).

App Store "App Privacy": Identifiers (Device ID: push token) – app functionality, not linked; Contact info (name, e-mail) – app functionality, linked, only when the user comments. Play "Data safety": same; data encrypted in transit; users can request deletion by e-mail.

**Privacy policy URL:** https://stg-sz.net/datenschutzerklaerung/ — add the app section below (draft, please review before publishing):

> **App „STG Schülerzeitung“ (iOS/Android)**
> Die App lädt Inhalte von stg-sz.net. Dabei wird eine zufällige, nicht personenbezogene Installations-ID übertragen, mit der Artikelaufrufe einmal pro Tag gezählt werden. Wenn du Mitteilungen aktivierst, speichern wir das Push-Token deines Geräts und die ausgewählten Ressorts auf unserem Server; die Zustellung erfolgt über den Push-Dienst von Expo (Expo, Inc., USA) und Apple bzw. Google. Du kannst Mitteilungen jederzeit in der App ausschalten; das Token wird dann gelöscht. Lesezeichen und Einstellungen bleiben ausschließlich auf deinem Gerät. Beim Kommentieren gelten die Angaben zu Kommentaren auf dieser Seite. Die App enthält keine Werbung und keine Tracking-Dienste. Fragen und Löschwünsche: Staedtisches-Gymnasium.Bad-Segeberg@schule.landsh.de

## 6. Review requirements covered

- Impressum reachable in-app (Einstellungen → Impressum → „Über uns“ page with school address).
- User-generated content (Apple guideline 1.2): comments are pre-moderated and e-mail-verified; every comment has a „Melden“ action that e-mails the editors; the composer explains the rules.
- Push permission is asked only when the user turns it on in settings (not at first launch).
- Encryption export: `ITSAppUsesNonExemptEncryption = false` (HTTPS only).
- Universal links: `.well-known/apple-app-site-association` and `assetlinks.json` live on stg-sz.net.

## 7. Screenshots

Required: iPhone 6.9" (1320×2868), iPad 13" (2064×2752, because the app supports iPad), Android phone (any, ≥1080 px). Generated from simulators with `mobile/scripts/store-screenshots.sh` (see there); frames and captions are optional.
