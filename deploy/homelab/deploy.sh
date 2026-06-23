#!/usr/bin/env bash
# Pull latest DataGame-MVP from GitHub and redeploy the isolated Docker stack.
set -euo pipefail

ROOT="${DATAGAME_ROOT:-$HOME/datagame-mvp}"
REPO_DIR="$ROOT/repo"
WEB_DIR="$REPO_DIR/web"
ENV_FILE="$ROOT/.env"
export DATAGAME_ENV_FILE="$ENV_FILE"
COMPOSE="docker compose -f docker-compose.prod.yml --env-file $ENV_FILE"

log() { printf '[datagame-deploy] %s\n' "$*"; }

if [[ ! -d "$REPO_DIR/.git" ]]; then
  log "ERROR: repo missing at $REPO_DIR — run setup-homelab.sh first"
  exit 1
fi

if [[ ! -f "$ENV_FILE" ]]; then
  log "ERROR: missing $ENV_FILE"
  exit 1
fi

cd "$REPO_DIR"
git fetch origin main

LOCAL="$(git rev-parse HEAD)"
REMOTE="$(git rev-parse origin/main)"

if [[ "${1:-}" != "--force" && "$LOCAL" == "$REMOTE" ]]; then
  log "Already on latest commit ($LOCAL)"
  cd "$WEB_DIR"
  if ! docker ps --format '{{.Names}}' | grep -qx datagame-web; then
    log "Containers not running — starting stack"
    $COMPOSE up -d
  fi
  exit 0
fi

log "Updating $LOCAL -> $REMOTE"
git pull --ff-only origin main

cd "$WEB_DIR"
log "Building images"
$COMPOSE build

log "Starting stack"
$COMPOSE up -d

log "Done. App listening on http://127.0.0.1:3020"
