# Paint Shop Dojo

Kiosk training and assessment platform for the **Toyota Kirloskar Motor (TKM) Paint Shop Training Program**. A Turborepo monorepo containing the admin dashboard, the kiosk-facing quiz app, an interactive training game, the API backend, and a local print agent.

## Architecture

| Package | Type | Stack | Dev port |
| --- | --- | --- | --- |
| `apps/admin-app` | Admin dashboard | Next.js 16 (App Router), React 19 | `3000` |
| `apps/backend` | REST + WebSocket API | NestJS 11, Prisma 7, PostgreSQL | `3001` |
| `apps/quiz-app` | Kiosk quiz/assessment | Next.js 16 (App Router, PWA), React 19 | `3002` |
| `apps/game-app` | Training game | Vite 8 + Phaser 4 | `5173` |
| `apps/print-agent` | Local certificate print server | Node.js + WebSocket | — |
| `packages/ui` | Shared React components (`@repo/ui`) | React 19 | — |
| `packages/eslint-config` | Shared ESLint config (`@repo/eslint-config`) | ESLint 9 | — |
| `packages/typescript-config` | Shared tsconfig presets (`@repo/typescript-config`) | — | — |

## Prerequisites

- **Node.js** `>=20`
- **pnpm** `>=10` — the repo pins `pnpm@10.34.4` via `packageManager`; run `corepack enable` to have the right version selected automatically.
- **Docker** — for the local PostgreSQL database (and optional pgAdmin).

## Getting started

```sh
# 1. Install dependencies
pnpm install

# 2. Configure env files (copy the templates and edit as needed)
cp apps/backend/.env.example  apps/backend/.env
cp apps/admin-app/.env.example apps/admin-app/.env
cp apps/quiz-app/.env.example  apps/quiz-app/.env

# 3. Start the database (PostgreSQL on :5433, pgAdmin on :5050)
pnpm db:up

# 4. Apply migrations, and seed initial data on a fresh DB
pnpm db:migrate
pnpm db:seed          # first run only

# 5. Run everything
pnpm dev
```

Once running:

| Service | URL |
| --- | --- |
| Admin app | http://localhost:3000 |
| Backend API | http://localhost:3001/api |
| Swagger docs | http://localhost:3001/api/docs |
| Quiz app | http://localhost:3002 |
| Game app | http://localhost:5173 |
| pgAdmin | http://localhost:5050 |

## Scripts

Run from the repo root. Turbo fans these out across every workspace package:

| Command | Description |
| --- | --- |
| `pnpm dev` | Run all apps in watch mode |
| `pnpm build` | Build all apps and packages |
| `pnpm lint` | Lint all packages |
| `pnpm test` | Run tests (currently the backend suite) |
| `pnpm check-types` | Type-check all packages |
| `pnpm clean` | Remove build artifacts (`.next`, `dist`, `.turbo`) |
| `pnpm format` / `format:check` | Format / check with Prettier |

Database helpers delegate to the backend workspace:

| Command | Description |
| --- | --- |
| `pnpm db:up` / `db:down` | Start / stop the PostgreSQL container |
| `pnpm db:migrate` | Apply pending migrations (`prisma migrate deploy`) |
| `pnpm db:generate` | Regenerate the Prisma client |
| `pnpm db:seed` | Seed initial data (`prisma/seed.ts`) |
| `pnpm db:studio` | Open Prisma Studio |
| `pnpm db:reset` | Drop, re-migrate, and re-seed the database |

To target a single app, use a filter, e.g. `pnpm --filter admin-app dev`.

## Dependency versions

Shared dependency versions (TypeScript, React, Next.js, ESLint, etc.) are centralized in the pnpm **catalog** in `pnpm-workspace.yaml`. Packages reference them with `catalog:` rather than hard-coded ranges — bump a version once there and it applies everywhere.

## Further reading

- [`apps/backend/README.md`](apps/backend/README.md) — API endpoints, WebSocket events, database schema
- [`apps/quiz-app/README.md`](apps/quiz-app/README.md) — kiosk quiz flow and configuration
