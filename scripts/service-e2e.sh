#!/usr/bin/env sh
set -eu

COMPOSE_FILE="docker-compose.e2e.yml"
COMPOSE_PROJECT_NAME="gc-project-e2e"

cleanup() {
  docker compose -p "$COMPOSE_PROJECT_NAME" -f "$COMPOSE_FILE" down -v
}

trap cleanup EXIT INT TERM

docker compose -p "$COMPOSE_PROJECT_NAME" -f "$COMPOSE_FILE" up -d --wait
pnpm --filter @gc-project/service test:e2e
