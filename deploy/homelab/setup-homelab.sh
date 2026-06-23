#!/usr/bin/env bash
# One-time homelab bootstrap for DataGame-MVP (does not touch other projects).
set -euo pipefail

ROOT="$HOME/datagame-mvp"
REPO_URL="${DATAGAME_REPO_URL:-https://github.com/Mikey01-ui/DataGame-MVP.git}"
REPO_DIR="$ROOT/repo"
ENV_FILE="$ROOT/.env"
DEPLOY_KEY="$ROOT/deploy_key"

log() { printf '[datagame-setup] %s\n' "$*"; }

mkdir -p "$ROOT"

if [[ ! -d "$REPO_DIR/.git" ]]; then
  log "Cloning $REPO_URL"
  git clone "$REPO_URL" "$REPO_DIR"
else
  log "Repo already cloned"
fi

if [[ ! -f "$ENV_FILE" ]]; then
  POSTGRES_PASSWORD="$(openssl rand -hex 24)"
  AUTH_SECRET="$(openssl rand -base64 32)"
  cat >"$ENV_FILE" <<EOF
# DataGame homelab secrets — edit SMTP and AUTH_URL before going live
POSTGRES_PASSWORD=$POSTGRES_PASSWORD
AUTH_SECRET=$AUTH_SECRET
AUTH_URL=http://127.0.0.1:3020
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SMTP_FROM=
DATAGAME_ENV_FILE=$ENV_FILE
EOF
  chmod 600 "$ENV_FILE"
  log "Created $ENV_FILE — add SMTP credentials and your public AUTH_URL"
fi

# Deploy key for GitHub Actions (optional)
if [[ ! -f "$DEPLOY_KEY" ]]; then
  ssh-keygen -t ed25519 -f "$DEPLOY_KEY" -N "" -C "datagame-mvp-deploy"
  log "Created deploy key at $DEPLOY_KEY"
  log "Add this public key to ~/.ssh/authorized_keys with deploy.sh restriction:"
  echo ""
  printf 'command="%s/deploy/homelab/deploy.sh --force",no-port-forwarding,no-X11-forwarding,no-agent-forwarding,no-pty ' "$REPO_DIR"
  cat "${DEPLOY_KEY}.pub"
  echo ""
  log "Add the private key to GitHub repo secret HOMELAB_SSH_KEY"
fi

# systemd user units for auto-pull every 3 minutes
SYSTEMD_DIR="$HOME/.config/systemd/user"
mkdir -p "$SYSTEMD_DIR"

cat >"$SYSTEMD_DIR/datagame-deploy.service" <<EOF
[Unit]
Description=Deploy DataGame-MVP from GitHub

[Service]
Type=oneshot
Environment=DATAGAME_ROOT=$ROOT
ExecStart=$REPO_DIR/deploy/homelab/deploy.sh
EOF

cat >"$SYSTEMD_DIR/datagame-deploy.timer" <<EOF
[Unit]
Description=Poll GitHub for DataGame-MVP updates

[Timer]
OnBootSec=2min
OnUnitActiveSec=3min
Persistent=true

[Install]
WantedBy=timers.target
EOF

systemctl --user daemon-reload
systemctl --user enable --now datagame-deploy.timer

log "Enabled auto-deploy timer (checks GitHub every 3 minutes)"
log "Running first deploy..."
bash "$REPO_DIR/deploy/homelab/deploy.sh" --force
log "Setup complete"
