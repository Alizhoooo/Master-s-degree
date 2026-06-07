#!/bin/bash
set -e

echo "▶️ [1/6] Generating Prisma client..."
npx prisma generate

echo "▶️ [2/6] Pushing schema to database..."
npx prisma db push --skip-generate --accept-data-loss

echo "▶️ [3/6] Running seed script..."
node dist-seed/seed.js || echo "⚠️ Seed failed (may already be applied)"

echo "▶️ [4/6] Ensuring role assignments..."
node dist-scripts/assign-roles.js || echo "⚠️ Role assignment failed (continuing)"

echo "▶️ [5/6] Seeding print forms registry..."
node dist-scripts/seed-print-forms.js || echo "⚠️ Print forms seed failed (continuing)"

echo "▶️ [6/6] Starting backend..."
exec node dist/main.js
