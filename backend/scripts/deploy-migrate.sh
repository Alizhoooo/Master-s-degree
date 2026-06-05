#!/bin/bash
set -e

echo "▶️ [1/5] Generating Prisma client..."
npx prisma generate

echo "▶️ [2/5] Pushing schema to database..."
npx prisma db push --skip-generate --accept-data-loss

echo "▶️ [3/5] Running seed script..."
node dist-seed/seed.js || echo "⚠️ Seed failed (may already be applied)"

echo "▶️ [4/5] Ensuring role assignments..."
node dist-scripts/assign-roles.js || echo "⚠️ Role assignment failed (continuing)"

echo "▶️ [5/5] Starting backend..."
exec node dist/main.js
