#!/bin/sh
set -eu
cd /workspace
node scripts/preview.mjs stop || true
if curl -sf -o /dev/null --max-time 2 http://127.0.0.1:8080/health; then
  exit 0
fi
export HOST=0.0.0.0
export PORT=8080
export NODE_ENV=development
npm run dev >>/tmp/app-startup.log 2>&1 &
