#!/usr/bin/env bash
# Run AFTER `cloudflared tunnel login` created ~/.cloudflared/cert.pem
# Works with Vercel DNS (miltomy.com) — adds CNAME via Vercel CLI from your laptop.
set -euo pipefail

TUNNEL_NAME="${DATAGAME_TUNNEL_NAME:-datagame-omni}"
HOSTNAME="${DATAGAME_HOSTNAME:-omni.miltomy.com}"
ORIGIN="${DATAGAME_ORIGIN:-http://127.0.0.1:3020}"
ROOT="${DATAGAME_ROOT:-$HOME/datagame-mvp}"
REPO_DIR="$ROOT/repo"
CF_DIR="$HOME/.cloudflared"
CF_CONFIG="$CF_DIR/config.yml"
PM2_CONFIG="$REPO_DIR/deploy/homelab/datagame.config.js"

log() { printf '[finish-tunnel] %s\n' "$*"; }

if [[ ! -f "$CF_DIR/cert.pem" ]]; then
  log "ERROR: $CF_DIR/cert.pem missing — run: cloudflared tunnel login"
  exit 1
fi

if ! cloudflared tunnel list 2>/dev/null | grep -q "$TUNNEL_NAME"; then
  log "Creating tunnel $TUNNEL_NAME"
  cloudflared tunnel create "$TUNNEL_NAME"
fi

TUNNEL_ID="$(cloudflared tunnel list 2>/dev/null | awk -v n="$TUNNEL_NAME" '$0 ~ n {print $1; exit}')"
CREDS="$CF_DIR/${TUNNEL_ID}.json"
CNAME_TARGET="${TUNNEL_ID}.cfargotunnel.com"

cat >"$CF_CONFIG" <<EOF
tunnel: $TUNNEL_ID
credentials-file: $CREDS

ingress:
  - hostname: $HOSTNAME
    service: $ORIGIN
  - service: http_status:404
EOF

log "Wrote $CF_CONFIG"
log "Add this DNS record at your DNS provider (Vercel DNS for miltomy.com):"
log "  CNAME  omni  ->  $CNAME_TARGET"
log ""
log "Vercel CLI (run from laptop):"
log "  npx vercel dns add miltomy.com omni CNAME $CNAME_TARGET --scope mikey01-uis-projects"

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

pm2 delete datagame-tunnel 2>/dev/null || true
pm2 start "$PM2_CONFIG" --only datagame-tunnel
pm2 save

log "Tunnel running. After DNS propagates, remove omni.miltomy.com from Vercel project domains."
log "Set AUTH_URL=https://$HOSTNAME in $ROOT/.env and run deploy.sh --force"
