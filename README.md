# NestJS Microservices Boilerplate (Monorepo)

Production-ready NestJS monorepo with a Fastify HTTP gateway, NATS-based microservices, Prisma (Supabase Postgres), shared library, and Vitest unit/e2e tests.

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
- Redis (local via Docker Compose)

## Environment

Copy `.env.example` to `.env` and fill values:

```bash
cp .env.example .env
```

Required variables:

- **`DATABASE_URL`**: Supabase Postgres connection string
- **`NATS_URL`**: NATS server URL (default: `nats://127.0.0.1:4222`)
- **`REDIS_HOST`**, **`REDIS_PORT`**, **`REDIS_PASSWORD`**: Redis cache (or **`REDIS_URL`**)
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

### Start infrastructure (Docker)

```bash
npm run docker:up
```

Starts **NATS** (`./data/nats`) and **Redis** with password (`./data/redis`). Use the same `REDIS_PASSWORD` in `.env` as in Compose.

Other Docker scripts: `npm run docker:down`, `npm run docker:logs`.

### Build app images (local)

From the repository root (build context must be `.` so Prisma and `libs/` are included):

```bash
docker build -f apps/gateway/Dockerfile -t nestjs-boilerplate-gateway:local .
docker build -f apps/auth-service/Dockerfile -t nestjs-boilerplate-auth:local .
docker build -f apps/events-service/Dockerfile -t nestjs-boilerplate-events:local .
```

Run a built image (example: gateway). Point env vars at your Postgres, NATS, and Redis (same as `.env`):

```bash
docker run --rm -p 3000:3000 --env-file .env nestjs-boilerplate-gateway:local
```

Auth and events are NATS workers (no HTTP port); run them with the same `--env-file` and ensure `NATS_URL` (or `NATS_HOST` + `NATS_PORT`) reaches a reachable NATS server.

If `npm ci` fails when building locally, regenerate the lockfile in strict mode (Docker does not use `legacy-peer-deps` from `.npmrc`):

```bash
NPM_CONFIG_LEGACY_PEER_DEPS=false npm install
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
