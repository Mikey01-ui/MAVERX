# OMNI connections (nheion ↔ game)

## Env

| Side | Variable | Purpose |
|------|----------|---------|
| nheion | `VITE_OMNI_API_URL` | Game API base (invites, players, settings) |
| nheion | `VITE_OMNI_GAME_URL` | Public game URL used in invite links / deep links |
| nheion | `VITE_DASHBOARD_API_KEY` | Sent as `X-Dashboard-Key` |
| game | `DASHBOARD_API_KEY` | Must match dashboard key |
| game | `DASHBOARD_ORIGINS` | CORS allowlist (include nheion origin; `*` ok for demos) |
| game | `OMNI_PUBLIC_URL` | Host stamped into invite register URLs |
| game | SMTP_* | Required for Settings notify-email delivery |

## API map

| Dashboard action | Method | Path |
|------------------|--------|------|
| List / create invites | GET/POST | `/api/invites` |
| Revoke invite | PATCH | `/api/invites/:id` `{ action: "revoke" }` |
| List players + progress | GET | `/api/admin/players` |
| Reset mission progress | POST | `/api/admin/players/:id/reset` |
| Notify email settings | GET/PATCH | `/api/admin/settings` |
| Locales | GET | `/api/locales` |
| Player register (invite-only) | POST | `/api/register` |

Auth header for admin routes: `X-Dashboard-Key: <DASHBOARD_API_KEY>`.
