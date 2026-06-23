# Deployment architecture (Kapitein Labs pattern)

| Layer | Where |
|-------|--------|
| Domain | **Vercel** (`omni.miltomy.com`) |
| App + API + auth | **Homelab** Docker (`datagame-web` on `:3020`) |
| Database | **Homelab** Postgres (`datagame-postgres`, local Docker network) |
| SMTP | **Homelab** relay (`datagame-smtp` on `:587`) |
| Public tunnel | **cloudflared** quick tunnel (`datagame-tunnel` PM2) |

Vercel does **not** talk to Postgres directly. Edge middleware proxies all traffic to the homelab tunnel when `HOMELAB_TUNNEL_URL` is set.

## Homelab services

```bash
# App + DB
cd ~/datagame-mvp/repo/web
docker compose -f docker-compose.prod.yml --env-file ~/datagame-mvp/.env up -d

# Tunnel (PM2)
pm2 start ~/datagame-mvp/repo/deploy/homelab/datagame.config.js --only datagame-tunnel
```

When the tunnel restarts, the `trycloudflare.com` URL changes. Update Vercel:

```bash
# From web/
printf '%s' 'https://NEW-URL.trycloudflare.com' | npx vercel env rm HOMELAB_TUNNEL_URL production -y --scope mikey01-uis-projects
printf '%s' 'https://NEW-URL.trycloudflare.com' | npx vercel env add HOMELAB_TUNNEL_URL production --scope mikey01-uis-projects --yes
```

Then redeploy (push to `main` or `npx vercel deploy --prod`).

## Teammate workflow

Push to `main` on GitHub → Vercel auto-deploys (proxy config) → homelab app serves all requests.

Homelab app code updates: pull on homelab + `docker compose up -d --build web` (or re-enable deploy timer).

## Vercel env vars

| Variable | Purpose |
|----------|---------|
| `HOMELAB_TUNNEL_URL` | cloudflared URL (required for production proxy) |
| `AUTH_SECRET` | Must match `~/datagame-mvp/.env` on homelab |
| `AUTH_URL` | `https://omni.miltomy.com` |

`DATABASE_URL` on Vercel is **not used** when proxying (DB stays on homelab).
