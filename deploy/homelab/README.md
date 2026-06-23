# DataGame homelab deployment

Isolated stack under `~/datagame-mvp` — does not modify other homelab projects.

## What runs

| Service | Container | Host access |
|---------|-----------|-------------|
| Next.js app | `datagame-web` | `127.0.0.1:3020` |
| PostgreSQL | `datagame-postgres` | Docker network only (not port 5432) |

SMTP uses external credentials in `.env` (e.g. Gmail). No local mail server is installed.

## One-time setup

```bash
bash deploy/homelab/setup-homelab.sh
```

Edit `~/datagame-mvp/.env` — set `AUTH_URL` to your public URL and SMTP vars.

## Auto-deploy

1. **Timer (default)** — `datagame-deploy.timer` polls GitHub every 3 minutes and redeploys when `main` changes.
2. **GitHub Actions (instant)** — add repo secrets:
   - `HOMELAB_HOST` = `192.168.1.50`
   - `HOMELAB_USER` = `choso`
   - `HOMELAB_SSH_KEY` = private key from `~/datagame-mvp/deploy_key`

## Public URL (Cloudflare Tunnel)

Point a new tunnel at `http://127.0.0.1:3020` (separate from existing tunnels). Update `AUTH_URL` in `.env` to match, then redeploy.

## Manual deploy

```bash
~/datagame-mvp/repo/deploy/homelab/deploy.sh --force
```
