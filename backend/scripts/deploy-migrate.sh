#!/bin/bash
set -e

echo "▶️ [1/4] Generating Prisma client..."
npx prisma generate

echo "▶️ [2/4] Running database migrations..."
# Mark baseline migration as applied (idempotent — no-op if already recorded)
npx prisma migrate resolve --applied "20260528184928_init" 2>/dev/null || true
# Apply any pending migrations (soft-delete columns, AuditLog table, indexes)
npx prisma migrate deploy

echo "▶️ [3/4] Running seed script..."
node dist-seed/seed.js || echo "⚠️ Seed failed (may already be applied)"

echo "▶️ [4/4] Starting backend..."
exec node dist/main.js
