# Vercel deployment (DataGame-MVP)

## Import project

1. [vercel.com/new](https://vercel.com/new) → import **Mikey01-ui/DataGame-MVP**
2. **Root Directory** → `web`
3. Framework: Next.js (auto-detected)

## Database (Neon — easiest)

1. Vercel project → **Storage** → **Create Database** → **Neon** (or connect existing Neon)
2. Link to project → copies `DATABASE_URL` automatically
3. After first deploy, run migrations once from your machine:

```bash
cd web
DATABASE_URL="<paste-neon-url>" npx prisma migrate deploy
```

Optional seed: `DATABASE_URL="..." npm run db:seed`

## Environment variables

| Variable | Value |
|----------|--------|
| `DATABASE_URL` | From Neon (auto if linked) |
| `AUTH_SECRET` | `openssl rand -base64 32` |
| `AUTH_URL` | `https://your-subdomain.miltomy.com` |
| `SMTP_HOST` | Homelab public IP (see homelab `smtp.env`) |
| `SMTP_PORT` | `587` |
| `SMTP_USER` | `datagame` (from homelab `smtp.env`) |
| `SMTP_PASS` | Relay password from homelab `smtp.env` |
| `SMTP_FROM` | `Operation OMNI <your@gmail.com>` |

## Domain

Project → **Settings** → **Domains** → add e.g. `omni.miltomy.com`  
If `miltomy.com` is on Vercel, DNS is automatic.

## Homelab (SMTP only)

App runs on **Vercel**. Homelab only runs the SMTP relay:

```bash
~/datagame-mvp/repo/deploy/homelab/setup-smtp.sh
# Edit ~/datagame-mvp/smtp.env with Gmail app password, re-run setup-smtp.sh
```

Ensure router forwards **port 587** → homelab `192.168.1.50`.
