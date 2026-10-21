# VMcare

VMcare is an offline-first AI symptom triage web application for rural and low-bandwidth settings. It uses a MERN backend, a public Vite client, and an administrative dashboard.

Clinical safety note: the starter rules are WHO IMCI-style educational content for fever, cough, diarrhea, vomiting, headache, abdominal pain, rash, and pregnancy danger signs. They must be reviewed, localized, and approved by qualified medical professionals before real-world use.

## Structure

- `server` - Node.js, Express, MongoDB, Mongoose, JWT auth, refresh tokens, role middleware, gzip, helmet, rate limiting, sync API, admin APIs.
- `admin` - React Vite dashboard for login, rules/questions/languages, clinics, health workers, and anonymized analytics.
- `client` - React Vite web application with offline browser storage, speech output, clinic directory, patient registration, history, and sync.

## Setup

1. Install Node.js and MongoDB.
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

## Vercel deployment

Deploy three Vercel projects from this one repository, selecting the indicated **Root Directory** for each project:

| Project | Root Directory | Required environment variables |
| --- | --- | --- |
| Public web app | `client` | `VITE_API_URL=https://<api-project>.vercel.app/api` |
| Admin dashboard | `admin` | `VITE_API_URL=https://<api-project>.vercel.app/api` |
| API | `server` | `MONGO_URI`, `JWT_SECRET`, `CORS_ORIGIN` |

Create a MongoDB Atlas database and allow Vercel access before deploying the API. Set `CORS_ORIGIN` to the two deployed Vercel origins, comma-separated. After the API deployment is live, set both web projects' `VITE_API_URL` to its `/api` URL and redeploy those web projects. Do not use the seeded credentials in a public production deployment; replace them and protect the admin URL.

Vercel does not run `npm run seed`, so its Atlas database starts empty. To use the sample accounts, set your local `server/.env` to the **same Atlas `MONGO_URI`** configured in Vercel and run `npm run seed` once from the repository root. Then redeploy the client after setting `VITE_API_URL` exactly to `https://<your-api-project>.vercel.app/api`. In Vercel, `MONGO_URI`, `JWT_SECRET`, and `CORS_ORIGIN` belong to the `server` project; `VITE_API_URL` belongs separately to both the `client` and `admin` projects. Atlas must allow Vercel connections (temporarily `0.0.0.0/0` during testing, then restrict it appropriately).

The clinic map follows the device GPS while open and requests current facilities from OpenStreetMap through `GET /api/clinics/nearby`. If that directory cannot be reached, it deliberately shows the bundled offline facility list instead.

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

The web client saves patients and triage records in browser storage first with `synced=0`, `localId`, and `updatedAt`. When online, `syncNow` posts unsynced records to `/api/sync`, then marks accepted rows as synced. On launch or manual sync, the app checks `/api/rules/latest` and stores newer rules locally. Server conflict handling is last-write-wins using `updatedAt`.

Low-bandwidth choices include gzip compression, compact JSON sync payloads, delta clinic sync, paginated lists, local rules, and local clinic/history views.

## Test Plan

1. Offline triage: start the web app with network off, select a language, run a triage, and confirm a result appears and the history row is saved.
2. Red-flag override: answer `Yes` for breathing difficulty, chest pain, severe bleeding, unconsciousness, or pregnancy danger signs; the result must be `RED` regardless of other answers.
3. Unsure escalation: complete triage without selecting symptoms; the result must be `YELLOW`, not `GREEN`.
4. Sync: log in as the health worker, create records offline, restore network, select Sync, and confirm rows are marked synced and appear in admin analytics.
5. Rules update: publish a new rule version in the admin dashboard, restart or sync the mobile app online, and confirm the newer version replaces local rules.
6. Clinic directory: open Clinics offline and confirm seeded clinics show with call buttons.
