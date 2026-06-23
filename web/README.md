# Operation OMNI — Web App

Next.js app with email/password auth, server-persisted mission progress, and legacy mission iframe shell.

## Local setup

```bash
cd web
cp .env.example .env
docker compose up -d
npm install
npm run db:migrate
npm run db:seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

**Finale email (optional):** set `SMTP_*` in `.env` to send the Operation OMNI results PDF when a player opts in on the finale screen. Use a dedicated mailbox or app password (e.g. Gmail: `smtp.gmail.com`, port `587`, app password).

**Seed account:** `playtest@omni.local` / `playtest12`

**Smoke test** (with `npm run dev` running):

```bash
npm run smoke-test
```

## Vercel deploy

1. Set project root to `web/`.
2. Add env vars: `DATABASE_URL`, `AUTH_SECRET`, `AUTH_URL` (production URL).
3. Attach Vercel Postgres or Neon; run `npx prisma migrate deploy` against production once.

## Content edits

- Login copy: `content/login.json`
- Hub copy: `content/hub.json`
- Missions: `content/missions/mN/meta.json`
- Media URLs: `content/missions/mN/media.json` (see `docs/MEDIA_STORAGE.md`)

## Missions (React migration)

Original HTML is archived in `reference/legacy-missions/` (repo root) and mirrored at `public/reference/legacy-missions/` for browser viewing.

| Layer | Location |
|-------|----------|
| Reference HTML | `reference/legacy-missions/Mission *.html` |
| Copy + protocol text | `content/missions/mN/intro.json` |
| Intro / protocol UI | `components/missions/phases/` |
| Game logic (port next) | `lib/game/mN/` |
| Mission route | `/mission/m1` … `/mission/m5` |

**Mission 1** — intro, protocol, and **playable React gameplay** (evidence board, XP desktop, 4-lead verify loop, debrief → M2).

**Missions 2–5** — intro/protocol shell + migration stub; port each mission from `reference/legacy-missions/` next.

Legacy iframe copies remain in `public/legacy/` if you set `"renderer": "legacy"` in a mission `meta.json`.
