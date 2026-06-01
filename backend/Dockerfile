FROM node:20-bookworm-slim AS builder
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package*.json ./
RUN npm install --legacy-peer-deps
COPY . .
RUN npx prisma generate
RUN npm run build
RUN npx tsc prisma/seed.ts --outDir dist-seed --skipLibCheck --esModuleInterop --module commonjs

FROM node:20-bookworm-slim AS runner
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package*.json ./
RUN npm install --legacy-peer-deps --omit=dev
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/dist-seed ./dist-seed
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/scripts/deploy-migrate.sh ./scripts/deploy-migrate.sh
RUN chmod +x ./scripts/deploy-migrate.sh
EXPOSE 3001
CMD ["./scripts/deploy-migrate.sh"]
