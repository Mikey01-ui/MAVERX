# MAVERX / Operation OMNI

Narrative data-literacy escape room (game) + admin dashboard in one repo.

## Stack

- **Game:** Next.js (`web/`) — invite register → intro → missions 1–5 → hub
- **Dashboard:** Vite React (`nheion/`) — Invites / Accounts / Stats wired to game admin APIs
- **Auth:** Auth.js credentials + Prisma/Postgres
- **Reference:** Legacy HTML missions in `reference/legacy-missions/`

## Quick start

### Game (port 3000)

```bash
cd web
npm install
cp .env.example .env   # DATABASE_URL, AUTH_SECRET, DASHBOARD_API_KEY, OMNI_PUBLIC_URL
npx prisma migrate dev
npm run db:seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Admin dashboard (port 5173)

```bash
cd nheion
npm install
cp .env.example .env   # VITE_OMNI_API_URL + VITE_DASHBOARD_API_KEY (= game DASHBOARD_API_KEY)
npm run dev
```

Open [http://127.0.0.1:5173](http://127.0.0.1:5173).

## Language / groups / invites

- **Registration is invite-only** — bare `/register` redirects to login; players need `?invite=px_…` (or group token).
- Invite language: **English** / **Dutch** / **Anyone** (`locale=any` → player picks EN/NL in the register wizard).
- Difficulty on the invite stamps `User.difficulty` (Easy / Standard / Hard).
- **Group.locale** drives mission language when grouped; otherwise `User.preferredLocale`.
- APIs: `GET/POST /api/invites`, `GET /api/invites/preview`, `PATCH /api/invites/:id`,
  `GET/PATCH /api/admin/settings`, `GET /api/admin/players`, `POST /api/admin/players/:id/reset`,
  `GET/POST /api/locales`, `GET/PATCH /api/group`, `GET /api/me/locale`.
- Auth for dashboard → game: `X-Dashboard-Key: $DASHBOARD_API_KEY` (or admin session cookie).
- Env (game): `DASHBOARD_API_KEY`, `DASHBOARD_ORIGINS`, `OMNI_PUBLIC_URL`, plus SMTP vars for register notify mail.
- Env (dashboard): `VITE_OMNI_API_URL`, `VITE_OMNI_GAME_URL`, `VITE_DASHBOARD_API_KEY`.

## Test accounts

| Role | Email | Password |
|------|-------|----------|
| Playtest | `playtest@omni.local` | `playtest12` |
| Admin (all missions unlocked, skip nav) | `admin@maverxtest.com` | `test123.com` |

## Missions

Each mission ends with a **stats debrief** driven by live gameplay state (time, accuracy, score, crew/routing breakdown).

1. **M1** — Evidence board / cross-reference
2. **M2** — Data ownership tribunal
3. **M3** — Ethics routing / vault
4. **M4** — Onboarding flow handoffs
5. **M5** — Framing, crew Q&A, vote
