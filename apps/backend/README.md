# Paint Shop Dojo — Backend API

REST + WebSocket API for the TKM Paint Shop kiosk training platform. Built with NestJS 11, Prisma 7, and PostgreSQL.

---

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
  - [Local Development](#local-development)
  - [Docker (Recommended)](#docker-recommended)
- [Environment Variables](#environment-variables)
- [Database](#database)
  - [Migrations](#migrations)
  - [Seeding](#seeding)
  - [Schema Overview](#schema-overview)
- [API Reference](#api-reference)
  - [Authentication](#authentication)
  - [Endpoints](#endpoints)
- [WebSocket](#websocket)
- [Architecture](#architecture)
  - [Module Map](#module-map)
  - [Request Lifecycle](#request-lifecycle)
- [Security](#security)
- [Testing](#testing)
- [Scripts](#scripts)
- [Deployment](#deployment)
- [Contributing](#contributing)

---

## Overview

The backend serves three client apps in the monorepo:

| Client | Port | Purpose |
|---|---|---|
| `quiz-app` | 3000 | Kiosk app for participant assessments |
| `admin-app` | 3002 | Admin dashboard for HR / managers |
| `game-app` | 3003 | Interactive paint process game |

Core features: JWT authentication, multilingual quiz engine (EN/JP/KN), real-time leaderboard via WebSocket, PDF certificate generation, role-based access control, and an admin reporting/export layer.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | NestJS 11 |
| Language | TypeScript 5.7 (strict mode) |
| ORM | Prisma 7 with `@prisma/adapter-pg` |
| Database | PostgreSQL 15 |
| Auth | JWT (`passport-jwt`) |
| WebSocket | Socket.IO 4 (`@nestjs/platform-socket.io`) |
| Validation | `class-validator` + `class-transformer` |
| Config | `@nestjs/config` + Joi schema validation |
| Rate Limiting | `@nestjs/throttler` |
| Security | `helmet`, CORS allowlist, RBAC |
| PDF | PDFKit |
| Health Checks | `@nestjs/terminus` |
| API Docs | Swagger / OpenAPI (`@nestjs/swagger`) |
| Testing | Jest 30 + `@nestjs/testing` + `jest-mock-extended` + `@faker-js/faker` |

---

## Project Structure

```
apps/backend/
├── prisma/
│   ├── schema/                # Multi-file Prisma schema (Prisma 7)
│   │   ├── _datasource.prisma # Generator + datasource block
│   │   ├── enums.prisma       # Shared enums (Role, SessionStatus, …)
│   │   ├── participant.prisma # Designation, Line, Language, ParticipantType, Participant
│   │   ├── session.prisma     # ParticipantSession
│   │   ├── quiz.prisma        # Question, QuizAttempt, QuizAnswer, PerformanceLevel
│   │   ├── leaderboard.prisma # LeaderboardEntry
│   │   ├── certificate.prisma # Certificate
│   │   └── game.prisma        # GameStage, GameSession
│   ├── prisma.config.ts       # Prisma CLI config (schema folder, connection string)
│   ├── seed.ts                # Reference data seed
│   └── migrations/            # Versioned SQL migrations
├── src/
│   ├── main.ts                # Bootstrap: helmet, CORS, pipes, Swagger
│   ├── app.module.ts          # Root module, global config + throttler
│   ├── app.controller.ts      # Public endpoints: GET /languages, /lines, /participant-types
│   ├── app.service.ts         # Queries for languages, lines, participant types
│   ├── config/
│   │   ├── constants.ts       # Shared numeric constants (page size, limits)
│   │   └── env.validation.ts  # Joi schema — validates all required env vars at startup
│   ├── common/
│   │   ├── decorators/        # @CurrentParticipant, @Roles
│   │   ├── filters/           # HttpExceptionFilter (global)
│   │   ├── guards/            # JwtAuthGuard, RolesGuard
│   │   ├── interceptors/      # TransformInterceptor (response envelope)
│   │   ├── interfaces/        # JwtPayload, ApiResponse<T>, PaginatedResult<T>
│   │   └── test/
│   │       └── prisma.mock.ts # Shared DeepMock<PrismaService> factory
│   └── modules/
│       ├── admin/
│       │   ├── reports/       # GET /admin/reports/* (ADMIN only)
│       │   ├── export/        # GET /admin/export/sessions → CSV
│       │   └── admin.module.ts
│       ├── auth/
│       │   ├── auth.service.ts
│       │   └── auth.service.spec.ts
│       ├── certificate/       # PDF certificate generation
│       ├── game/              # Paint process game stages + sessions
│       ├── health/            # GET /health (DB ping)
│       ├── leaderboard/
│       │   ├── leaderboard.service.ts
│       │   ├── leaderboard.service.spec.ts
│       │   └── leaderboard.gateway.ts  # Socket.IO — broadcasts after every submission
│       ├── participant/       # Participant CRUD, photo upload
│       ├── prisma/            # Global PrismaService (pg pool + Prisma 7 adapter)
│       └── quiz/
│           ├── quiz.service.ts
│           └── quiz.service.spec.ts
├── test/
│   ├── setup/
│   │   ├── global-setup.ts    # Runs once: push schema to test DB
│   │   └── env.ts             # Load .env.test before each suite
│   ├── helpers/
│   │   ├── app.helper.ts      # createTestApp() — full NestJS app with ThrottlerGuard disabled
│   │   └── db.helper.ts       # truncateAll(), seedBaseData(), disconnectDb()
│   ├── health.e2e-spec.ts
│   ├── reference-data.e2e-spec.ts
│   ├── auth.e2e-spec.ts
│   ├── quiz.e2e-spec.ts
│   ├── leaderboard.e2e-spec.ts
│   ├── jest-e2e.json
│   └── tsconfig.json          # Extends tsconfig.jest.json, adds jest types for IDE
├── .env.test                  # Test environment variables (test DB on port 5433)
├── uploads/                   # Runtime photo uploads (gitignored)
├── .env.example
├── tsconfig.json
└── tsconfig.jest.json          # Jest-specific tsconfig (CommonJS module resolution)
```

---

## Prerequisites

| Tool | Version |
|---|---|
| Node.js | ≥ 20 |
| pnpm | ≥ 10 |
| PostgreSQL | 15 (or Docker) |
| Docker + Compose | For the local database |

---

## Getting Started

### Local Development

**1. Install dependencies** (from monorepo root):

```bash
pnpm install
```

**2. Set up environment variables:**

```bash
cp apps/backend/.env.example apps/backend/.env
# Edit .env — set DATABASE_URL and JWT_SECRET at minimum
```

**3. Run database migrations:**

```bash
cd apps/backend
pnpm prisma migrate deploy
```

**4. Seed reference data:**

```bash
pnpm prisma db seed
```

**5. Start the dev server:**

```bash
pnpm --filter backend start:dev
```

The API is available at `http://localhost:3001/api`.  
Swagger UI is at `http://localhost:3001/api/docs`.

---

### Docker

#### Infrastructure only (recommended for local development)

Run only the database and pgAdmin — the backend and frontend apps run locally via `pnpm`:

```bash
# From the monorepo root
docker compose up db -d
docker compose up pgadmin -d
```

| Service | URL | Credentials |
|---|---|---|
| PostgreSQL | `localhost:5433` | user: `user` / password: `password` / db: `ps_dojo` |
| pgAdmin | http://localhost:5050 | email: `admin@tkm.com` / password: `admin` |

After the DB is up, run migrations + seed and start the backend locally (see [Local Development](#local-development)).

> PostgreSQL is exposed on host port **5433** (maps to container 5432) to avoid conflicts with a local Postgres instance.

> The apps themselves run locally via `pnpm` (there are no app Dockerfiles); `docker compose` only provides the database and pgAdmin.

---

## Environment Variables

Copy `.env.example` to `.env` and fill in the required values. All variables are validated at startup via Joi — missing or invalid required variables cause an immediate crash with a descriptive error.

> **Secrets: dev vs. production.** `.env` files are for **local development only** and are gitignored (only `.env.example` and `.env.test` are committed). In production, provide `DATABASE_URL`, `JWT_SECRET`, and `BREVO_API_KEY` through your host's environment/secret manager (e.g. the Render dashboard) — **never** commit them. Generate a strong `JWT_SECRET` (≥ 32 chars) with `node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"`.

| Variable | Required | Default | Description |
|---|---|---|---|
| `DATABASE_URL` | ✅ | — | PostgreSQL connection string |
| `JWT_SECRET` | ✅ | — | JWT signing secret (**min 32 chars**) |
| `JWT_EXPIRY` | | `8h` | JWT token lifetime |
| `PORT` | | `3001` | HTTP server port |
| `BACKEND_URL` | | `http://localhost:3001` | Public base URL of this API |
| `ALLOWED_ORIGINS` | | `http://localhost:3001,http://localhost:5173` | Comma-separated CORS + WebSocket allowed origins |
| `THROTTLE_TTL_MS` | | `60000` | Rate-limit window in milliseconds |
| `THROTTLE_LIMIT` | | `10` | Max requests per window (login endpoint: 5/60s) |
| `QUIZ_PASS_THRESHOLD_PERCENT` | | `50` | Minimum score percentage to pass |
| `QUIZ_DEFAULT_QUESTION_COUNT` | | `10` | Default number of questions per session |
| `UPLOADS_PHOTOS_DIR` | | `./uploads/photos` | Filesystem path for profile photo storage |
| `UPLOAD_MAX_SIZE_BYTES` | | `5242880` | Max upload size in bytes (default 5 MB) |
| `EXPORT_MAX_ROWS` | | `10000` | Max rows returned in CSV exports |
| `ADMIN_DEFAULT_PAGE_SIZE` | | `20` | Default page size for admin list endpoints |
| `COMPANY_NAME` | | `TOYOTA KIRLOSKAR MOTOR` | Company name printed on certificates |
| `TRAINING_PROGRAM_NAME` | | `Paint Shop Training Program` | Program name printed on certificates |
| `CERT_NUMBER_PREFIX` | | `TKM-PS` | Prefix for generated certificate numbers |
| `QUIZ_COOLDOWN_PASS_DAYS` | | `365` | Days before a passed participant may retake the quiz |
| `QUIZ_COOLDOWN_FAIL_DAYS` | | `30` | Days before a failed participant may retake the quiz |
| `GAME_COOLDOWN_PASS_DAYS` | | `365` | Days before a passed participant may replay the game |
| `GAME_COOLDOWN_FAIL_DAYS` | | `30` | Days before a failed participant may replay the game |
| `SEED_ADMIN_EMAIL` | | `admin@tkm.co.in` | Email of the admin created by `pnpm db:seed` |
| `SEED_ADMIN_PASSWORD` | | `change-me-please` | Password of the seeded admin (change in production) |
| `SEED_ADMIN_NAME` | | `Admin` | Display name of the seeded admin |
| `BREVO_API_KEY` | | `` (empty) | Brevo API key; blank disables report email dispatch |
| `BREVO_SENDER_EMAIL` | | `` (empty) | From-address for outgoing emails |
| `BREVO_SENDER_NAME` | | `Paint Shop Dojo` | From-name for outgoing emails |

---

## Database

### Migrations

Migrations are managed with Prisma Migrate. The `prisma/` directory contains versioned SQL files applied in order.

The schema location and seed command are configured in `prisma.config.ts`, so no `--schema` flag is needed.

```bash
# Apply existing migrations to a new database
pnpm prisma migrate deploy

# Create a new migration from schema changes (dev only)
pnpm prisma migrate dev

# Regenerate Prisma client after schema changes
pnpm prisma generate

# Open Prisma Studio (browser-based DB editor)
pnpm prisma studio
```

| Migration | Description |
|---|---|
| `20260420072548_init` | Initial schema — all core models |
| `20260420133100_add_question_time_limit` | Added `timeLimit` field to `Question` |
| `20260420162921_add_participant_role` | Added `role` enum (`USER` / `ADMIN`) to `Participant` |

### Seeding

The seed script populates all reference/lookup data needed to run the app:

```bash
pnpm prisma db seed
```

Seeded data includes: 3 languages (EN/JP/KN), designations, production lines, participant types, performance levels, game stages, and 20 quiz questions with trilingual translations.

### Schema Overview

```
Participant ──────────────── ParticipantSession ──── QuizAttempt ──── QuizAnswer
     │                              │                      │
     │                              │                      ├── PerformanceLevel
     ├── Designation                 │                      ├── LeaderboardEntry
     ├── Line                       │                      └── Certificate
     └── ParticipantType            │
                                    └── (status: IN_PROGRESS | COMPLETED | FAILED)

Question ──── QuestionTranslation  (per Language)
    └──── QuestionOption ──── OptionTranslation  (per Language)

GameStage ──── GameSession ──── Participant
```

**Enums:** `Role` (USER, ADMIN) · `SessionStatus` (IN_PROGRESS, COMPLETED, FAILED) · `QuestionType` (SINGLE_CHOICE, MULTIPLE_CHOICE, TRUE_FALSE) · `LeaderboardType` (GLOBAL, DAILY, WEEKLY, MONTHLY) · `GameSessionStatus` (IN_PROGRESS, COMPLETED, FAILED)

---

## API Reference

All endpoints are prefixed with `/api`. Interactive documentation is available at `/api/docs` (Swagger UI).

### Authentication

The API uses **Bearer token** authentication. Obtain a token via `POST /api/auth/login`, then include it in subsequent requests:

```
Authorization: Bearer <token>
```

Tokens expire after `JWT_EXPIRY` (default 8 hours). The JWT strategy re-validates the participant exists in the database on every request.

---

### Endpoints

#### Auth

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/api/auth/login` | None *(rate-limited: 5 req/min)* | Log in with employee code. Returns JWT + participant profile. |
| `GET` | `/api/auth/me` | JWT | Get the currently authenticated participant. |

**Login request body:**
```json
{ "employeeCode": "EMP001" }
```

**Login response:**
```json
{
  "token": "<jwt>",
  "participant": {
    "id": "uuid",
    "name": "John Doe",
    "code": "EMP001",
    "designation": "Paint Shop",
    "line": "Line A",
    "type": "Operator",
    "imageUrl": null
  }
}
```

---

#### Quiz

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/quiz/questions` | JWT | Fetch randomised questions. Query: `lang` (EN/JP/KN, default EN), `count` (default 10, max 50). |
| `POST` | `/api/quiz/sessions` | JWT | Start a new quiz session. Returns `sessionId` + questions. |
| `POST` | `/api/quiz/sessions/:id/submit` | JWT | Submit answers. Returns score, percentage, performance level, duration. |
| `GET` | `/api/quiz/sessions/:id` | JWT | Fetch result for own session *(ownership enforced — returns 404 for sessions you don't own)*. |

**Start session request body:**
```json
{ "language": "EN", "questionCount": 10 }
```

**Submit answers request body:**
```json
{
  "answers": [
    { "questionId": "uuid", "optionId": "uuid", "timeTaken": 12 }
  ]
}
```

---

#### Leaderboard

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/leaderboard` | None | Get ranked leaderboard. Query: `type` (GLOBAL/DAILY/WEEKLY/MONTHLY), `limit`. |

---

#### Participants

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/participants` | JWT + **ADMIN** | Paginated participant list. Query: `page`, `limit`. |
| `GET` | `/api/participants/:code` | JWT | Look up participant by employee code. |
| `GET` | `/api/participants/:code/stats` | JWT | Performance stats for a participant. |
| `POST` | `/api/participants/me/photo` | JWT | Upload profile photo (`multipart/form-data`, field: `photo`). Allowed: jpg, jpeg, png, webp. Max 5 MB. |

---

#### Certificates

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/certificates/:attemptId` | JWT | Get certificate metadata. Creates the certificate if it doesn't exist yet. |
| `GET` | `/api/certificates/:attemptId/download` | JWT | Download certificate as a PDF file. |

---

#### Game

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/game/stages` | JWT | List all active paint process stages. |
| `GET` | `/api/game/stages/:id` | JWT | Get a single stage by ID. |
| `POST` | `/api/game/sessions/start/:stageId` | JWT | Start a game session for a stage. |
| `POST` | `/api/game/sessions/:id/complete` | JWT | Complete a session with final score. |
| `GET` | `/api/game/progress` | JWT | Get current participant's progress across all stages. |

---

#### Admin *(ADMIN role required)*

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/admin/reports/overview` | JWT + **ADMIN** | Dashboard stats: totals, completion rate, average score, breakdown by performance level. |
| `GET` | `/api/admin/reports/sessions` | JWT + **ADMIN** | Paginated session list. Query: `page`, `limit`, `designationId`, `status`, `from`, `to`. |
| `GET` | `/api/admin/reports/designations` | JWT + **ADMIN** | Per-designation performance stats. |
| `GET` | `/api/admin/export/sessions` | JWT + **ADMIN** | Download sessions as CSV. Query: `designationId`, `status`, `from`, `to`. |

---

#### Health

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/health` | None | Returns application + database health status. Used by load balancers and orchestrators. |

**Healthy response:**
```json
{
  "status": "ok",
  "info": { "database": { "status": "up" } }
}
```

---

### Response Envelope

All successful responses are wrapped by `TransformInterceptor`:

```json
{
  "success": true,
  "data": { ... },
  "timestamp": "2026-04-21T10:00:00.000Z"
}
```

All error responses follow this shape:

```json
{
  "success": false,
  "statusCode": 404,
  "timestamp": "2026-04-21T10:00:00.000Z",
  "path": "/api/quiz/sessions/unknown-id",
  "error": "Session not found"
}
```

---

## WebSocket

The leaderboard broadcasts real-time updates over Socket.IO.

**Namespace:** `/leaderboard`  
**CORS:** Controlled by the `ALLOWED_ORIGINS` env var (same allowlist as HTTP).

| Event | Direction | Payload | Description |
|---|---|---|---|
| `leaderboard:snapshot` | Server → Client | `LeaderboardEntry[]` | Sent immediately on connection |
| `leaderboard:get` | Client → Server | — | Request a fresh snapshot |
| `leaderboard:update` | Server → Client | `LeaderboardEntry[]` | Broadcast after every quiz submission |

**Client connection example:**
```js
import { io } from 'socket.io-client';

const socket = io('http://localhost:3001/leaderboard');

socket.on('leaderboard:snapshot', (entries) => {
  console.log('Initial leaderboard:', entries);
});

socket.on('leaderboard:update', (entries) => {
  console.log('Leaderboard updated:', entries);
});

// Request fresh data manually
socket.emit('leaderboard:get');
```

---

## Architecture

### Module Map

```
AppModule
├── ConfigModule (global)        — env vars + Joi validation (env.validation.ts)
├── ThrottlerModule              — global rate limiting
├── PrismaModule (global)        — single pg.Pool + Prisma 7 adapter-pg client
├── AuthModule                   — POST /auth/login, JWT strategy, passport
├── ParticipantModule            — participant CRUD, photo upload
├── QuizModule
│   └── imports LeaderboardModule (circular — forwardRef)
├── LeaderboardModule            — leaderboard reads + Socket.IO gateway
├── CertificateModule            — PDF generation (PDFKit)
├── GameModule                   — paint stages + game sessions
├── AdminModule
│   ├── ReportsModule            — GET /admin/reports/*
│   └── ExportModule             — GET /admin/export/sessions → CSV
└── HealthModule                 — GET /health DB ping
```

### Request Lifecycle

```
HTTP Request
    │
    ├── helmet()             — security headers (XFO, CSP, HSTS, …)
    ├── CORS                 — origin allowlist check
    ├── ThrottlerGuard       — rate limit (login: 5/min · global: 10/min)
    ├── JwtAuthGuard         — verify Bearer token + load participant from DB
    ├── RolesGuard           — check participant.role against @Roles(...)
    ├── ValidationPipe       — DTO validation (whitelist, forbidNonWhitelisted)
    │
    ├── Controller
    │       └── Service → PrismaService → PostgreSQL
    │
    ├── TransformInterceptor — wrap: { success, data, timestamp }
    └── HttpExceptionFilter  — catch all → { success, statusCode, error, path }
```

---

## Security

| Concern | Implementation |
|---|---|
| HTTP security headers | `helmet()` sets X-Frame-Options, CSP, HSTS, X-Content-Type-Options, etc. |
| CORS | Explicit `ALLOWED_ORIGINS` allowlist for both HTTP and WebSocket |
| Authentication | JWT (HS256), re-validated against DB on every request, configurable expiry |
| Authorisation | `RolesGuard` + `@Roles('ADMIN')` on admin routes and participant list |
| Input validation | Global `ValidationPipe` — `whitelist: true`, `forbidNonWhitelisted: true` |
| Rate limiting | Login: 5 req/60s · Global: 10 req/60s (configurable via env) |
| File uploads | MIME type check + extension allowlist (jpg/jpeg/png/webp) + configurable size cap |
| Data ownership | Quiz session results enforce `participantId` match — prevents IDOR |
| Env validation | Joi schema — app fails immediately at startup with a clear error if required vars are absent |
| Secrets | `.env` is gitignored; only `.env.example` (no secrets) is committed |

---

## Testing

### Stack

| Tool | Purpose |
|---|---|
| `jest` + `ts-jest` | Test runner and TypeScript compilation |
| `@nestjs/testing` | `Test.createTestingModule()` — full NestJS DI in tests |
| `jest-mock-extended` | Type-safe deep mocks of `PrismaService` — no real DB needed for unit tests |
| `@faker-js/faker` | Realistic fake data for test fixtures (names, UUIDs, numbers) |
| `supertest` | HTTP assertions for e2e tests |

### Running Tests

```bash
# Run all unit tests
pnpm test

# Watch mode (re-runs on file save)
pnpm test:watch

# With coverage report
pnpm test:cov

# End-to-end tests (requires test DB on port 5433)
pnpm test:e2e
```

### Unit Tests

Unit tests live alongside the source file they test (`*.service.spec.ts`). A shared Prisma mock factory at `src/common/test/prisma.mock.ts` is reused across all suites — no real database required.

```
src/
├── common/test/
│   └── prisma.mock.ts               # createPrismaMock() — DeepMockProxy<PrismaService>
└── modules/
    ├── auth/auth.service.spec.ts
    ├── quiz/quiz.service.spec.ts
    └── leaderboard/leaderboard.service.spec.ts
```

| Suite | Tests | What's covered |
|---|---|---|
| `auth.service.spec.ts` | 5 | Login success, JWT payload shape, unknown code → 404, error message, `getMe` |
| `quiz.service.spec.ts` | 13 | Score calculation (all correct / all wrong / partial), pass/fail threshold, unknown question IDs skipped, performance level, leaderboard called, session not found, already completed, ownership check |
| `leaderboard.service.spec.ts` | 10 | Default type/limit, custom type/limit, sort order, result passthrough, `getTop10`, null attempt → undefined, upsert data, recalc triggered, rank ordering (highest score = rank 1) |

### End-to-End Tests

E2e tests spin up the full NestJS application against a dedicated PostgreSQL test database and make real HTTP requests via `supertest`.

**Prerequisites:** A second PostgreSQL instance on port 5433 (or add a `test` service to `docker-compose.yml`). The schema is pushed automatically before the suite runs.

```bash
# One-time: start the test DB (if running postgres locally on 5433)
# Or add the test DB to docker-compose and run: docker compose up db-test

pnpm test:e2e
```

**Suite layout:**

```
test/
├── setup/
│   ├── global-setup.ts       # Runs once before all suites: prisma db push → test DB
│   └── env.ts                # Loads .env.test before each test file
├── helpers/
│   ├── app.helper.ts         # createTestApp() — full app, ThrottlerGuard bypassed
│   └── db.helper.ts          # truncateAll(), seedBaseData(), disconnectDb()
├── health.e2e-spec.ts        # GET /api/health
├── reference-data.e2e-spec.ts# GET /api/languages, /lines, /participant-types
├── auth.e2e-spec.ts          # POST /api/auth/login, GET /api/auth/me
├── quiz.e2e-spec.ts          # Full quiz flow: questions → session → submit → result
└── leaderboard.e2e-spec.ts   # Leaderboard after quiz completion
```

**E2e test results (26 tests across 5 suites):**

| Suite | Tests | Coverage |
|---|---|---|
| `health.e2e-spec.ts` | 1 | DB ping returns `{ status: "ok" }` |
| `reference-data.e2e-spec.ts` | 3 | Languages, lines, and participant types endpoints |
| `auth.e2e-spec.ts` | 7 | Login success/404/400, JWT me endpoint, 401 guards |
| `quiz.e2e-spec.ts` | 11 | Questions, session creation, submit (score/IDOR/double-submit), result retrieval |
| `leaderboard.e2e-spec.ts` | 4 | Empty board, public access, query params, entry after submission |

**Important design choices:**

- `ThrottlerGuard` is overridden with `canActivate: () => true` in `createTestApp()` — the auth endpoint's 5 req/min limit would block `beforeEach` login calls otherwise.
- `globalSetup` uses `prisma db push --accept-data-loss` (not `migrate dev`) to keep the test cycle fast — test DB is always in sync without tracking migration history.
- `beforeEach` in each suite truncates all tables and re-seeds, guaranteeing test isolation regardless of order.
- The `ThrottlerGuard` override is done at the module level: `.overrideGuard(ThrottlerGuard).useValue({ canActivate: () => true })`, which disables it for the entire test app.

### Writing a New Unit Test

```ts
import { Test } from '@nestjs/testing';
import { createPrismaMock } from '../../common/test/prisma.mock';
import { MyService } from './my.service';
import { PrismaService } from '../prisma/prisma.service';

describe('MyService', () => {
  let service: MyService;
  const prisma = createPrismaMock();

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        MyService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get(MyService);
  });

  it('does something', async () => {
    prisma.participant.findUnique.mockResolvedValue({ id: '1', name: 'Test' });
    const result = await service.doSomething('1');
    expect(result.name).toBe('Test');
  });
});
```

### Configuration Notes

- `tsconfig.jest.json` overrides the main tsconfig with `"module": "CommonJS"` and `"moduleResolution": "node"` so Jest can load the test files without ESM conflicts.
- `test/tsconfig.json` extends `tsconfig.jest.json` and adds `"types": ["jest", "node"]` so the IDE resolves `describe`/`it`/`expect` without false positives.
- The main `tsconfig.json` excludes the `test/` directory so IDE type-checking uses the unit-test tsconfig.
- `@faker-js/faker` is pinned to v8 — the last CJS-compatible release. v9+ is pure ESM which is incompatible with Jest's CommonJS runtime without additional tooling.
- Prisma 7 with `@prisma/adapter-pg`: the generated client at `src/generated/prisma` is excluded from ts-jest transformation (`transformIgnorePatterns`) and `@prisma/client-runtime-utils` is explicitly mapped in `moduleNameMapper` to resolve a pnpm transitive-dependency visibility issue.

---

## Scripts

Run from `apps/backend/` or use `pnpm --filter backend <script>` from the monorepo root.

| Script | Description |
|---|---|
| `start:dev` | Development server with hot reload |
| `start:prod` | Run compiled production build |
| `build` | Generate Prisma client + compile TypeScript |
| `lint` | ESLint with auto-fix |
| `format` | Prettier format |
| `test` | Run all unit tests |
| `test:watch` | Unit tests in watch mode |
| `test:cov` | Unit tests with coverage report |
| `test:e2e` | End-to-end tests |

---

## Deployment

### Production Checklist

- [ ] Set `DATABASE_URL` to a production PostgreSQL instance
- [ ] Set `JWT_SECRET` to a cryptographically random string (≥ 32 characters)
- [ ] Set `ALLOWED_ORIGINS` to production frontend domain(s) only
- [ ] Run `pnpm prisma migrate deploy` (**never** `migrate dev` in production)
- [ ] Persist the `uploads/` directory via a volume mount or migrate to object storage (S3/GCS)
- [ ] Place a reverse proxy (nginx/Caddy) in front of port 3001 for TLS termination

### Notes

- The app **fails fast** at startup if `DATABASE_URL` or `JWT_SECRET` are missing — check container logs if the process exits immediately.
- Static uploads are served at `/uploads/*`. In production, serve this path via nginx or move uploads to object storage and update `UPLOADS_PHOTOS_DIR`.
- `prisma migrate deploy` is idempotent — safe to run on every deployment.

---

## Contributing

1. Branch off `main` — use `feature/`, `fix/`, or `chore/` prefixes
2. Follow the module pattern — one folder per domain, each with `controller`, `service`, and `module` files
3. Add DTOs with `class-validator` decorators for all request bodies
4. Run `pnpm lint` and `pnpm build` before opening a PR — both must pass
5. Update `.env.example` for any new environment variables
6. For schema changes, run `pnpm prisma migrate dev --name <description>` and commit the generated migration file alongside your code changes

---

## Quick Setup (New Machine)

**1. Clone and install:**
```bash
git clone <repo-url>
cd paint-shop-dojo
pnpm install
```

**2. Configure env:**
```bash
cp apps/backend/.env.example apps/backend/.env
# Edit DATABASE_URL and JWT_SECRET
```

**3. Start the database (PostgreSQL + pgAdmin):**
```bash
pnpm db:up
```

**4. Migrate and seed:**
```bash
pnpm db:migrate
pnpm db:seed        # first run only
```

**5. Run the backend (or `pnpm dev` for everything):**
```bash
pnpm --filter backend start:dev
```

**Reset the database (drop, re-migrate, re-seed):**
```bash
pnpm db:reset
```
