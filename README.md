# RuralCare

RuralCare is an offline-first AI symptom triage project for rural and low-bandwidth settings. It uses a MERN backend/admin stack and an Expo React Native mobile app that can run symptom triage fully offline from a versioned local rules file.

Clinical safety note: the starter rules are WHO IMCI-style educational content for fever, cough, diarrhea, vomiting, headache, abdominal pain, rash, and pregnancy danger signs. They must be reviewed, localized, and approved by qualified medical professionals before real-world use.

## Structure

- `server` - Node.js, Express, MongoDB, Mongoose, JWT auth, refresh tokens, role middleware, gzip, helmet, rate limiting, sync API, admin APIs.
- `admin` - React Vite dashboard for login, rules/questions/languages, clinics, health workers, and anonymized analytics.
- `mobile` - Expo React Native app with SQLite offline storage, speech output, local rules, clinic directory, patient registration, history, and sync.

## Setup

1. Install Node.js, MongoDB, Expo CLI, and EAS CLI.
2. Install dependencies:

```bash
npm run install:all
```

3. Configure the API:

```bash
cp server/.env.example server/.env
```

4. Start MongoDB locally, then seed:

```bash
npm run seed
```

Seeded accounts:

- Admin: `admin@ruralcare.local` / `AdminPass123`
- Health worker: `worker@ruralcare.local` / `WorkerPass123`

## Run

Backend:

```bash
npm run server
```

Admin dashboard:

```bash
npm run admin
```

Open `http://localhost:5173`.

Mobile:

```bash
npm run mobile
```

For Android emulator, `mobile/app.json` points to `http://10.0.2.2:5000/api`. For a physical phone, change `extra.apiUrl` to your computer LAN IP.

## APK Build

```bash
cd mobile
eas build -p android --profile preview
```

## API Summary

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `GET /api/rules/latest`
- `POST /api/sync`
- `GET /api/sync/delta`
- Admin only: `/api/admin/rules`, `/api/admin/clinics`, `/api/admin/health-workers`, `/api/admin/stats`

`User.role` supports `patient`, `health_worker`, and `admin`. Admin routes use JWT protection plus role checks.

## Offline Sync Design

The mobile app saves patients and triage records into SQLite first with `synced=0`, `localId`, and `updatedAt`. When online, `syncNow` posts unsynced records to `/api/sync`, then marks accepted rows as synced. On launch or manual sync, the app checks `/api/rules/latest` and stores newer rules locally. Server conflict handling is last-write-wins using `updatedAt`.

Low-bandwidth choices include gzip compression, compact JSON sync payloads, delta clinic sync, paginated lists, local rules, and local clinic/history views.

## Test Plan

1. Offline triage: start the mobile app with network off, select a language, run a triage, and confirm a result appears and the history row is saved.
2. Red-flag override: answer `Yes` for breathing difficulty, chest pain, severe bleeding, unconsciousness, or pregnancy danger signs; the result must be `RED` regardless of other answers.
3. Unsure escalation: complete triage without selecting symptoms; the result must be `YELLOW`, not `GREEN`.
4. Sync: log in as the health worker, create records offline, restore network, tap Sync, and confirm rows are marked synced and appear in admin analytics.
5. Rules update: publish a new rule version in the admin dashboard, restart or sync the mobile app online, and confirm the newer version replaces local rules.
6. Clinic directory: open Clinics offline and confirm seeded clinics show with call buttons.
