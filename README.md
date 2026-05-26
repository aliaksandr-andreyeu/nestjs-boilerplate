# NestJS Microservices Boilerplate (Monorepo)

Production-ready NestJS monorepo with a Fastify HTTP gateway, NATS-based microservices, Prisma (Postgres), shared library, and Vitest unit/e2e tests.

## What’s inside

- **Gateway** (`apps/gateway`): HTTP API + Swagger + WebSockets (Fastify)
- **Auth service** (`apps/auth-service`): NATS microservice (JWT auth, password reset)
- **Events service** (`apps/events-service`): NATS microservice (events CRUD)
- **Shared library** (`libs/shared`): DTOs, guards, filters, utilities
- **Prisma** (`prisma/`): single unified schema and migrations

## Architecture

- HTTP clients talk to **Gateway** (REST + WS).
- Gateway calls **auth/events** over **NATS** (request/response).
- Services use **Prisma** against a single Postgres database (schema `public`).

## Requirements

- Node.js (recommended via `.nvmrc`)
- Postgres (local or hosted, e.g. Supabase)
- NATS server

## Environment

Copy `.env.example` to `.env` and fill values:

```bash
cp .env.example .env
```

Required variables:

- **`DATABASE_URL`**: Postgres connection string
- **`NATS_URL`**: NATS server URL (default: `nats://127.0.0.1:4222`)
- **`JWT_SECRET`**: JWT signing secret
- **`COOKIE_SECRET`**: cookie signing secret (gateway)
- **`NODE_ENV`**: `development` / `production`
- **`PORT`**: gateway port (default `3000`)

## Install

```bash
npm install
```

## Prisma (database)

The Prisma setup is consolidated:

- **Schema**: `prisma/schema.prisma`
- **Migrations**: `prisma/migrations`
- **Config**: `prisma.config.ts`
- **Generated client**: `node_modules/@prisma/app-client`

Commands:

```bash
# generate Prisma client
npm run prisma:generate

# create/apply migrations (dev)
npm run prisma:migrate

# apply existing migrations (prod/CI)
npm run prisma:migrate:deploy
```

## Run locally

### Start NATS (Docker)

```bash
docker compose up -d nats
```

### Development (watch mode)

Run services in separate terminals:

```bash
npm run start:auth:dev
npm run start:events:dev
npm run start:gateway:dev
```

Gateway:

- **HTTP**: `http://localhost:3000`
- **Swagger**: `http://localhost:3000/api`

### Production-like

```bash
npm run start:auth:prod
npm run start:events:prod
npm run start:gateway:prod
```

## Tests

```bash
# unit tests
npm test

# e2e tests
npm run test:e2e
```

## Lint & format

```bash
npm run lint
npm run lint:fix
npm run format
```

## Error responses (gateway)

The gateway uses a global exception filter that turns internal errors into a consistent JSON shape and maps common RPC (NATS) business errors to appropriate HTTP status codes.
