# Project Countdown

Project Countdown is a local-first React + Vite web app for managing one active deadline and showing it on a clean split-flap inspired display page.

It has two routes:

- `/display` for the board-style countdown view
- `/edit` for updating the active countdown record

For the MVP, the app is designed around a single shared countdown record stored in Firebase Realtime Database. If Firebase env vars are not configured yet, the app falls back to local browser storage so the UI can still be developed and previewed locally.

## Features

- Mobile-friendly display and edit pages
- One active countdown record
- `countdown` and `countup` modes
- Event-name validation for board constraints
- Split-flap inspired board preview on both the display and edit flows
- Firebase Realtime Database service layer kept separate from UI code

## Local setup

1. Install dependencies:

```bash
npm install
```

2. Copy the example env file:

```bash
cp .env.example .env.local
```

3. Add your Firebase config values to `.env.local`.

4. Start the dev server:

```bash
npm run dev
```

## Required environment variables

The app expects these Vite env vars for Firebase:

```txt
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_DATABASE_URL=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

If they are left blank, the app runs in local preview mode and stores the countdown in browser `localStorage` instead of Firebase.

## Firebase Realtime Database setup

1. Create a Firebase project at https://console.firebase.google.com/.
2. Add a Web app to the project and copy the config values into `.env.local`.
3. Create a Realtime Database instance.
4. Start in test mode for local MVP work, or configure rules manually for your own environment.
5. Use this data shape:

```json
{
  "countdown": {
    "current": {
      "name": "CALC FINALS",
      "date": "2026-12-20",
      "mode": "countdown",
      "updatedAt": 1784567890000
    }
  }
}
```

## How the countdown logic works

- In `countdown` mode:
  - Before the date: `D - N`
  - On the date: `D - 0`
  - After the date: `D + N`
- In `countup` mode:
  - On the date: `D + 0`
  - After the date: `D + N`
- Before the date: the app previews `D - N` and warns that the date is still in the future

Event-name constraints:

- Uppercased on save
- Max 16 characters
- Allowed characters: letters, numbers, and `: . - ? !`

## Suggested deployment to Firebase Hosting

This MVP does not automate deployment, but Firebase Hosting is the intended target later.

Typical steps:

1. Install the Firebase CLI.
2. Run `firebase login`.
3. Run `firebase init hosting`.
4. Set the public directory to `dist`.
5. Configure single-page app rewrites so `/display` and `/edit` both resolve to `index.html`.
6. Build and deploy:

```bash
npm run build
firebase deploy
```

Example hosting rewrite:

```json
{
  "hosting": {
    "public": "dist",
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  }
}
```

## MVP security note

There is no authentication or PIN protection in this MVP. Anyone who can access the deployed `/edit` page and the connected Firebase database can update the countdown. That trade-off is intentional for the first version and should be tightened later with Firebase Auth, a PIN flow, and stricter database rules.

## Future ESP32 note

The data is stored as a simple JSON-like countdown record so a future ESP32 split-flap client can fetch the active board state more easily. The hardware client is not included in this MVP.
