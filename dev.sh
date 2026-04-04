#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
FRONTEND_PID=""

cleanup() {
  echo ""
  echo "Shutting down Karen..."
  if [ -n "$FRONTEND_PID" ] && kill -0 "$FRONTEND_PID" 2>/dev/null; then
    kill "$FRONTEND_PID" 2>/dev/null
    wait "$FRONTEND_PID" 2>/dev/null
  fi
  cd "$ROOT_DIR"
  docker compose down
  echo "Karen is resting. For now."
}
trap cleanup EXIT INT TERM

echo "🦞 Starting Karen Automated Correspondence Systems LLC..."
echo ""

# ── Preflight checks ──────────────────────────────────────────────

if ! docker info >/dev/null 2>&1; then
  echo "ERROR: Docker is not running. Start Docker Desktop first."
  exit 1
fi

if ! command -v pnpm >/dev/null 2>&1; then
  echo "ERROR: pnpm not found. Install with: npm i -g pnpm"
  exit 1
fi

# Copy .env from example if it doesn't exist
if [ ! -f "$ROOT_DIR/backend/.env" ]; then
  cp "$ROOT_DIR/backend/.env.example" "$ROOT_DIR/backend/.env"
  echo "Created backend/.env from .env.example — fill in your keys."
fi

# Ensure frontend .env.local exists with defaults
if [ ! -f "$ROOT_DIR/frontend/.env.local" ]; then
  cat > "$ROOT_DIR/frontend/.env.local" <<'ENVEOF'
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_SITE_URL=http://localhost:3000
ENVEOF
  echo "Created frontend/.env.local with default values."
fi

# ── Install frontend deps if needed ───────────────────────────────

if [ ! -d "$ROOT_DIR/frontend/node_modules" ]; then
  echo "Installing frontend dependencies..."
  (cd "$ROOT_DIR/frontend" && pnpm install)
  echo ""
fi

# ── Start backend (Docker) ────────────────────────────────────────

echo "Starting OpenClaw + backend..."
cd "$ROOT_DIR"
docker compose up --build -d

echo ""
echo "Waiting for backend..."

for i in $(seq 1 15); do
  if curl -sf http://localhost:8000/health >/dev/null 2>&1; then
    echo "✓ Backend ready at http://localhost:8000"
    break
  fi
  if [ "$i" -eq 15 ]; then
    echo "⚠ Backend not responding yet — check: docker compose logs backend"
  fi
  sleep 1
done

if curl -sf http://localhost:18789 >/dev/null 2>&1; then
  echo "✓ OpenClaw ready at http://localhost:18789"
else
  echo "⏳ OpenClaw still starting — check: docker compose logs openclaw"
fi

# ── Start frontend (Next.js) ──────────────────────────────────────

echo ""
echo "Starting frontend..."
cd "$ROOT_DIR/frontend"
pnpm dev --port 3000 &
FRONTEND_PID=$!

# Wait for Next.js to compile
for i in $(seq 1 20); do
  if curl -sf http://localhost:3000 >/dev/null 2>&1; then
    echo "✓ Frontend ready at http://localhost:3000"
    break
  fi
  if [ "$i" -eq 20 ]; then
    echo "⏳ Frontend still compiling..."
  fi
  sleep 1
done

# ── Ready ──────────────────────────────────────────────────────────

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Karen is ready. Karen is always ready."
echo ""
echo "  Frontend:   http://localhost:3000"
echo "  Backend:    http://localhost:8000"
echo "  OpenClaw:   http://localhost:18789"
echo ""
echo "  Backend logs:  docker compose logs backend -f"
echo "  Stop:          Ctrl+C"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Keep running — frontend is in background, wait for Ctrl+C
wait "$FRONTEND_PID"
