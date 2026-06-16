FROM node:22-slim AS deps
WORKDIR /app
COPY package*.json .npmrc ./
RUN npm ci --ignore-scripts

FROM node:22-slim AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run prisma:generate
RUN npm run build:gateway

FROM node:22-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts
EXPOSE 3000
CMD ["sh","-c","npx prisma migrate deploy --config prisma.config.ts && node dist/apps/gateway/main.js"]
