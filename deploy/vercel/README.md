# Vercel deployment (DataGame-MVP)

**Architecture:** Vercel hosts the app + domain. Homelab runs **Postgres** (port 5433) and **SMTP** (port 587).

## Deploy via CLI (already linked)

```bash
cd web
npx vercel deploy --prod --yes --scope mikey01-uis-projects
```

GitHub pushes can also trigger deploys if the repo is connected in the Vercel dashboard.

## Homelab services

| Service | Container | Port |
|---------|-----------|------|
| PostgreSQL | `datagame-postgres` | **5433** → 5432 |
| SMTP relay | `datagame-smtp` | **587** |

Start Postgres only (app runs on Vercel):

```bash
cd ~/datagame-mvp/repo/web
docker compose -f docker-compose.prod.yml --env-file ~/datagame-mvp/.env up -d postgres
```

Migrations (on homelab):

```bash
cd ~/datagame-mvp/repo/web
DATABASE_URL="postgresql://omni:<password>@127.0.0.1:5433/omni" npx prisma migrate deploy
```

## Router port forwards (required)

Vercel runs in the cloud — it must reach your homelab over the internet:

| Port | → Homelab | For |
|------|-----------|-----|
| **5433** | 192.168.1.50:5433 | Database |
| **587** | 192.168.1.50:587 | Email |

Without these, the site loads but login/register/email will fail.

## Vercel env vars

Set via dashboard or `vercel env add`. Required:

- `DATABASE_URL` → `postgresql://omni:<pass>@178.231.168.15:5433/omni`
- `AUTH_SECRET`, `AUTH_URL` (must match domain, e.g. `https://omni.miltomy.com`)
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`

## Domains

- Production: https://datagame-mvp.vercel.app
- Custom: https://omni.miltomy.com
