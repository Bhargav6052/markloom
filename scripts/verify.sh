#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
(cd backend && uv run --frozen ruff check app tests && uv run --frozen pytest -q)
(cd frontend && pnpm typecheck && pnpm lint && pnpm test && pnpm build && node db-test.mjs)
