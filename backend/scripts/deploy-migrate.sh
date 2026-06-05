#!/bin/bash
set -e

echo "▶️ [1/4] Generating Prisma client..."
npx prisma generate

echo "▶️ [2/4] Pushing schema to database..."
npx prisma db push --skip-generate --accept-data-loss

echo "▶️ [3/4] Running seed script..."
node dist-seed/seed.js || echo "⚠️ Seed failed (may already be applied)"

echo "▶️ [4/4] Starting backend..."
exec node dist/main.js
