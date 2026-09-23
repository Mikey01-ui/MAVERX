# DataGame-MVP

Operation OMNI — narrative data-literacy escape room (Mastermind terminal).

## Stack

- **App:** Next.js (`web/`) — login → video intro → missions 1–5 → hub
- **Auth:** NextAuth credentials + Prisma/Postgres progress API
- **Reference:** Legacy HTML missions in `reference/legacy-missions/`

## Quick start

```bash
cd web
npm install
cp .env.example .env   # configure DATABASE_URL + AUTH_SECRET
npx prisma migrate dev
npm run db:seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Language / groups / dashboard link

- **Group.locale** drives mission language (source of truth).
- **User.preferredLocale** is chosen at register; used only until the user is in a group.
- Built-in packs: `en`, `nl`. Admins can register more via `/dashboard` or `POST /api/locales`.
- **Admin dashboard** (separate repo `maverxdashboard`): create individual/group invites that open
  `{OMNI_PUBLIC_URL}/register?group=gx_…` or `?invite=px_…` with `lang` / `diff` / `co`.
- APIs: `GET/POST /api/invites`, `PATCH /api/invites/:id`, `GET/POST /api/locales`, `GET/PATCH /api/group`, `GET /api/me/locale`.
- Auth for dashboard → game: `X-Dashboard-Key: $DASHBOARD_API_KEY` (or admin session cookie).
- Env (game): `DASHBOARD_API_KEY`, `DASHBOARD_ORIGINS`, `OMNI_PUBLIC_URL`.
- Env (dashboard Vite): `VITE_OMNI_API_URL`, `VITE_OMNI_GAME_URL`, `VITE_DASHBOARD_API_KEY`.

Dutch **content packs** are not shipped yet — this is invite + locale plumbing.

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
