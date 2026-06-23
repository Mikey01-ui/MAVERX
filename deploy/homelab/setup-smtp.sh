#!/usr/bin/env bash
# Start the isolated DataGame SMTP relay on the homelab.
set -euo pipefail

ROOT="${DATAGAME_ROOT:-$HOME/datagame-mvp}"
ENV_FILE="$ROOT/smtp.env"
COMPOSE_FILE="$ROOT/repo/deploy/homelab/docker-compose.smtp.yml"

log() { printf '[datagame-smtp] %s\n' "$*"; }

mkdir -p "$ROOT"

if [[ ! -f "$ENV_FILE" ]]; then
  RELAY_PASS="$(openssl rand -hex 16)"
  cat >"$ENV_FILE" <<EOF
# Clients (Vercel) authenticate with these credentials
SMTP_USERNAME=datagame
SMTP_PASSWORD=$RELAY_PASS

# Gmail upstream — edit with your mailbox + app password
RELAYHOST_USERNAME=
RELAYHOST_PASSWORD=
EOF
  chmod 600 "$ENV_FILE"
  log "Created $ENV_FILE"
  log "Set RELAYHOST_USERNAME and RELAYHOST_PASSWORD (Gmail app password), then re-run."
  log "Vercel SMTP_USER=datagame SMTP_PASS=$RELAY_PASS"
  exit 0
fi

# shellcheck disable=SC1090
source "$ENV_FILE"
if [[ -z "${RELAYHOST_USERNAME:-}" || -z "${RELAYHOST_PASSWORD:-}" ]]; then
  log "ERROR: set RELAYHOST_USERNAME and RELAYHOST_PASSWORD in $ENV_FILE"
  exit 1
fi

export DATAGAME_SMTP_ENV_FILE="$ENV_FILE"
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d
log "SMTP relay listening on port 587"
log "Vercel env: SMTP_HOST=<your-public-ip> SMTP_PORT=587 SMTP_USER=${SMTP_USERNAME:-datagame} SMTP_PASS=<from smtp.env>"
