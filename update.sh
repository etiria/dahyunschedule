#!/usr/bin/env bash
# One-command update for the EGGIM labeling app on the VM.
#   ./update.sh
# Pulls the latest code and rebuilds/restarts the container. Images and labels
# live in ./eggim-data (a git-ignored volume) and are left untouched.
set -e
cd "$(dirname "$0")"
echo "==> git pull"
git pull
echo "==> rebuild & restart"
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
echo "==> done. current status:"
docker compose -f docker-compose.yml -f docker-compose.prod.yml ps
