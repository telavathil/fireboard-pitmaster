#!/usr/bin/env bash
# Copies fast_forward_cook.py into the running pit_boss container and runs
# it there (it needs the `app` package + REDIS_URL/DB_URL, which only exist
# inside that container - the image isn't volume-mounted, so a plain
# `docker exec` of the repo copy would run stale code after edits).
#
# Usage: backend/scripts/fast_forward_cook.sh [--target-c 95 --meat pork ...]
# Or via: make fast-forward ARGS="--target-c 95 --meat pork"
set -euo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")/../.."

CONTAINER_ID=$(docker compose ps -q pit_boss)
if [ -z "$CONTAINER_ID" ]; then
  echo "pit_boss container isn't running. Start the stack first: make up-d" >&2
  exit 1
fi

docker cp backend/scripts/fast_forward_cook.py "$CONTAINER_ID:/app/fast_forward_cook.py"
docker exec "$CONTAINER_ID" python fast_forward_cook.py "$@"
