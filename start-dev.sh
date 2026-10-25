#!/usr/bin/env bash
# ── Cinelytics dev launcher (macOS / Linux) ────────────────────────
# Starts the FastAPI backend (:8001) and the Vite dev server together.
set -euo pipefail
cd "$(dirname "$0")"

echo "[Cinelytics] starting backend on http://127.0.0.1:8001 ..."
(cd backend && .venv/bin/python -m uvicorn app.main:app --host 127.0.0.1 --port 8001) &
BACK_PID=$!

echo "[Cinelytics] starting frontend dev server ..."
(cd frontend && npm run dev) &
FRONT_PID=$!

trap "kill $BACK_PID $FRONT_PID 2>/dev/null" EXIT
echo
echo "API : http://127.0.0.1:8001/docs"
echo "Web : http://localhost:5173"
wait
