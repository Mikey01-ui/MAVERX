#!/usr/bin/env bash
# Named Cloudflare tunnel for omni.miltomy.com → local DataGame app.
# Requires: cloudflared logged in (`cloudflared tunnel login`), domain on Cloudflare.
set -euo pipefail

TUNNEL_NAME="${DATAGAME_TUNNEL_NAME:-datagame-omni}"
HOSTNAME="${DATAGAME_HOSTNAME:-omni.miltomy.com}"
ORIGIN="${DATAGAME_ORIGIN:-http://127.0.0.1:3020}"
ROOT="${DATAGAME_ROOT:-$HOME/datagame-mvp}"
REPO_DIR="$ROOT/repo"
CF_DIR="$HOME/.cloudflared"
CF_CONFIG="$CF_DIR/config.yml"
PM2_CONFIG="$REPO_DIR/deploy/homelab/datagame.config.js"

log() { printf '[datagame-tunnel] %s\n' "$*"; }

if ! command -v cloudflared >/dev/null; then
  log "ERROR: install cloudflared first"
  exit 1
fi

if [[ ! -d "$REPO_DIR" ]]; then
  log "ERROR: repo missing at $REPO_DIR — run setup-homelab.sh first"
  exit 1
fi

mkdir -p "$CF_DIR"

if ! cloudflared tunnel list 2>/dev/null | grep -q "$TUNNEL_NAME"; then
  log "Creating tunnel $TUNNEL_NAME"
  cloudflared tunnel create "$TUNNEL_NAME"
fi

TUNNEL_ID="$(cloudflared tunnel list 2>/dev/null | awk -v n="$TUNNEL_NAME" '$0 ~ n {print $1; exit}')"
if [[ -z "$TUNNEL_ID" ]]; then
  log "ERROR: could not resolve tunnel id for $TUNNEL_NAME"
  exit 1
fi

CREDS="$CF_DIR/${TUNNEL_ID}.json"
if [[ ! -f "$CREDS" ]]; then
  log "ERROR: missing credentials file $CREDS"
  exit 1
fi

log "Routing DNS $HOSTNAME → tunnel $TUNNEL_NAME"
cloudflared tunnel route dns "$TUNNEL_NAME" "$HOSTNAME" || true

cat >"$CF_CONFIG" <<EOF
tunnel: $TUNNEL_ID
credentials-file: $CREDS

ingress:
  - hostname: $HOSTNAME
    service: $ORIGIN
  - service: http_status:404
EOF

log "Wrote $CF_CONFIG"

# Update PM2 config to use named tunnel
cat >"$PM2_CONFIG" <<EOF
module.exports = {
  apps: [
    {
      name: "datagame-tunnel",
      script: "/usr/local/bin/cloudflared",
      args: "tunnel --config $CF_CONFIG run $TUNNEL_NAME",
      autorestart: true,
      watch: false,
      log_file: "$ROOT/datagame-tunnel.log",
      error_file: "$ROOT/datagame-tunnel.err",
    },
  ],
};
EOF

if command -v pm2 >/dev/null; then
  pm2 delete datagame-tunnel 2>/dev/null || true
  pm2 start "$PM2_CONFIG" --only datagame-tunnel
  pm2 save
  log "PM2 tunnel started"
else
  log "PM2 not found — run manually: cloudflared tunnel --config $CF_CONFIG run $TUNNEL_NAME"
fi

log "Done. Set AUTH_URL=https://$HOSTNAME in $ROOT/.env and run deploy.sh --force"
log "Remove omni.miltomy.com from Vercel if it is still attached there."
