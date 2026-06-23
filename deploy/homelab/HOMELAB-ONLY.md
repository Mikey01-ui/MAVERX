# Homelab-only deployment (recommended)

Host **everything** on the homelab. No Vercel proxy, no `HOMELAB_TUNNEL_URL`, no split builds.

| Piece | Where |
|-------|--------|
| Domain `omni.miltomy.com` | Cloudflare Tunnel → homelab `:3020` |
| App + API + auth | Docker `datagame-web` |
| Database | Docker `datagame-postgres` |
| SMTP | Homelab relay or Gmail |
| Deploys | Auto-pull from GitHub every 3 min (or push webhook) |

## Why this is simpler

The Vercel setup proxies HTML from homelab but served JS from Vercel — two builds that must stay in sync. Homelab-only serves one build from one place.

## One-time setup on homelab (`choso@192.168.1.50`)

### 1. App + auto-deploy (if not done)

```bash
cd ~/datagame-mvp/repo
git pull origin main
bash deploy/homelab/setup-homelab.sh   # clones repo, creates .env, enables deploy timer
```

Edit `~/datagame-mvp/.env`:

```env
AUTH_URL=https://omni.miltomy.com
AUTH_SECRET=<same secret you use today>
POSTGRES_PASSWORD=<existing>
# SMTP vars...
```

### 2. Cloudflare Tunnel with your real domain

Requires `miltomy.com` on Cloudflare (same account you use for other tunnels).

```bash
bash ~/datagame-mvp/repo/deploy/homelab/setup-cloudflare-tunnel.sh
```

That script:

- Creates a **named** tunnel `datagame-omni` (stable, unlike `trycloudflare.com`)
- Routes `omni.miltomy.com` → `http://127.0.0.1:3020`
- Starts it with PM2

Manual equivalent:

```bash
cloudflared tunnel create datagame-omni
cloudflared tunnel route dns datagame-omni omni.miltomy.com
# write ~/.cloudflared/config.yml (see setup-cloudflare-tunnel.sh)
pm2 start ~/datagame-mvp/repo/deploy/homelab/datagame.config.js --only datagame-tunnel
pm2 save
```

### 3. Point DNS away from Vercel

1. **Vercel** → project `datagame-mvp` → Settings → Domains → remove `omni.miltomy.com`
2. **Cloudflare** → DNS for `miltomy.com` → ensure `omni` is a CNAME to the tunnel (the route command above usually creates this)
3. Wait a few minutes for DNS

### 4. Redeploy with correct `AUTH_URL`

```bash
~/datagame-mvp/repo/deploy/homelab/deploy.sh --force
```

Open `https://omni.miltomy.com` — it should hit homelab directly.

## Auto-pull from GitHub

**Option A — Timer (already in repo, zero GitHub config)**

Checks `main` every 3 minutes and rebuilds when changed:

```bash
systemctl --user status datagame-deploy.timer
systemctl --user enable --now datagame-deploy.timer   # enable if inactive
```

**Option B — Instant deploy on push (GitHub Actions)**

Add secrets to `Mikey01-ui/DataGame-MVP`:

| Secret | Value |
|--------|--------|
| `HOMELAB_HOST` | `192.168.1.50` |
| `HOMELAB_USER` | `choso` |
| `HOMELAB_SSH_KEY` | contents of `~/datagame-mvp/deploy_key` on homelab |

Public key must be in `~/.ssh/authorized_keys` on homelab (printed by `setup-homelab.sh`).

## Teammate workflow

```
git push origin main  →  homelab pulls within 3 min (or instantly via Actions)  →  docker rebuild
```

No Vercel deploy needed.

## Optional: remove Vercel entirely

- Disconnect GitHub from the Vercel project, or delete the project
- Remove `HOMELAB_TUNNEL_URL` and proxy middleware (not used in homelab-only mode)
- Keep the repo on GitHub as the single source of truth

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| 502 / tunnel error | `pm2 logs datagame-tunnel`, confirm `datagame-web` is up on `:3020` |
| Login cookies wrong | `AUTH_URL` in `.env` must exactly match `https://omni.miltomy.com` |
| Old Vercel page | DNS still pointing to Vercel; remove domain there, flush DNS |
| Deploy not updating | `systemctl --user start datagame-deploy.service` or `deploy.sh --force` |
