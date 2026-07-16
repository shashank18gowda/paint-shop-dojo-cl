# Paint Shop Dojo — Admin App

Admin dashboard for the TKM Paint Shop kiosk training platform. Built with Next.js 16 (App Router), React Query, and Zustand.

Admins sign in with email + password and manage the training program: participants, questions, quizzes, certificates, reports, leaderboards, and game configuration.

---

## Development

The app runs on **port 3000** and talks to the [backend API](../backend) on port 3001.

From the repo root:

```sh
pnpm dev                    # run all apps, or:
pnpm --filter admin-app dev # just this app
```

Then open http://localhost:3000. Admins are redirected to `/login`.

## Configuration

Copy `.env.example` to `.env` and adjust:

| Variable | Default | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_API_URL` | `http://localhost:3001/api` | Backend API base URL, baked into the client bundle at build time. Match the backend's port. |

A default admin is created by the backend seed (`pnpm db:seed`) — see `apps/backend/.env` for the seeded credentials.

## Scripts

| Command | Description |
| --- | --- |
| `dev` | Dev server with hot reload on http://localhost:3000 |
| `build` | Production build |
| `start` | Serve the production build on port 3000 |
| `lint` | Lint with ESLint |
| `check-types` | Type-check with `tsc --noEmit` |

See the [root README](../../README.md) for full monorepo setup.
