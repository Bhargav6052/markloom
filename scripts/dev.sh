#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
api_port="${INKLOOM_API_PORT:-8000}"
web_port="${INKLOOM_WEB_PORT:-5173}"
origins="[\"http://127.0.0.1:$web_port\",\"http://localhost:$web_port\"]"
(cd backend && CORS_ORIGINS="$origins" uv run --frozen uvicorn app.main:app --host 127.0.0.1 --port "$api_port") &
api_pid=$!
(cd backend && uv run --frozen python -m app.worker) &
worker_pid=$!
trap 'kill "$api_pid" "$worker_pid" 2>/dev/null || true' EXIT INT TERM
(cd frontend && VITE_API_URL="http://127.0.0.1:$api_port" pnpm run dev --port "$web_port" --strictPort)
