# Paint Shop Dojo — Quiz App

Kiosk-facing training and assessment app for TKM Paint Shop employees. Built with Next.js 16 App Router, React Query, and Zustand.

---

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Architecture](#architecture)
  - [State Management](#state-management)
  - [API Layer](#api-layer)
  - [Routing & Auth](#routing--auth)
  - [Internationalisation](#internationalisation)
- [Screen Reference](#screen-reference)
- [Features Directory](#features-directory)
- [PWA](#pwa)
- [Scripts](#scripts)
- [Deployment](#deployment)
- [Contributing](#contributing)

---

## Overview

The quiz app is the primary participant-facing surface of the Paint Shop Dojo platform. It runs as a full-screen kiosk application on plant-floor touchscreen terminals.

**Participant flow:**

```
Welcome → Select Language → Select Role → Login (employee code) → Confirm Profile
    → Photo Capture (optional) → Menu → Quiz Instructions → Active Quiz
    → Results → Certificate / Leaderboard
```

Core capabilities:

- Multilingual UI — English, Kannada, Hindi
- Timed 10-question quiz with per-question countdowns
- Real-time leaderboard (GLOBAL / DAILY / WEEKLY / MONTHLY)
- Downloadable and printable PDF certificates
- Face detection-assisted photo capture via webcam
- Dark / Light theme and font-size controls — persisted across sessions
- Progressive Web App — installable, works offline for UI shell

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16.2 (App Router) |
| Language | TypeScript 5 (strict mode) |
| UI | React 19 + Tailwind CSS 4 |
| Server State | TanStack React Query 5 |
| Client State | Zustand 5 (with `persist` middleware) |
| Face Detection | face-api.js (TinyFaceDetector model) |
| PWA | `@ducanh2912/next-pwa` |
| Font | Inter (Google Fonts, variable) |

---

## Project Structure

```
apps/quiz-app/
├── app/
│   ├── layout.tsx                  # Root layout: fonts, theme init script, PWA meta
│   ├── providers.tsx               # ReactQueryProvider with default staleTime/retry config
│   ├── globals.css                 # CSS custom properties: --bg, --text, --border, data-theme
│   │
│   ├── page.tsx                    # / → thin wrapper
│   ├── language/page.tsx           # /language → thin wrapper
│   ├── participant-type/page.tsx   # /participant-type → thin wrapper
│   ├── login/page.tsx              # /login → thin wrapper
│   ├── confirm/page.tsx            # /confirm → thin wrapper
│   ├── photo/page.tsx              # /photo → thin wrapper
│   ├── menu/page.tsx               # /menu → thin wrapper
│   ├── quiz/page.tsx               # /quiz → thin wrapper
│   ├── quiz/active/page.tsx        # /quiz/active → thin wrapper
│   ├── quiz/results/[attemptId]/   # /quiz/results/:id → thin wrapper
│   ├── leaderboard/page.tsx        # /leaderboard → thin wrapper
│   └── certificate/[attemptId]/   # /certificate/:id → thin wrapper
│
│   ├── features/                   # All UI logic — domain-organised
│   │   ├── onboarding/
│   │   │   ├── WelcomeScreen.tsx   # Landing screen with theme/font/lang controls
│   │   │   ├── LanguagePicker.tsx  # Language selection (EN / KN / HI)
│   │   │   ├── ParticipantTypePicker.tsx  # Role selection (Employee / Contractor / Trainee)
│   │   │   └── PhotoCapture.tsx    # Webcam capture with face detection overlay
│   │   ├── auth/
│   │   │   ├── LoginForm.tsx       # Employee code entry
│   │   │   └── ConfirmProfile.tsx  # Profile confirmation + production line selection
│   │   ├── quiz/
│   │   │   ├── QuizInstructions.tsx # Rules, stats, start CTA
│   │   │   ├── ActiveQuiz.tsx      # Timed question/option loop with auto-advance
│   │   │   └── QuizResults.tsx     # Score ring, performance badge, action buttons
│   │   ├── leaderboard/
│   │   │   └── LeaderboardView.tsx # Podium + ranked list with filter dropdown
│   │   ├── certificate/
│   │   │   └── CertificateView.tsx # Certificate card with print and PDF download
│   │   └── menu/
│   │       └── MenuView.tsx        # Home hub — quiz CTA + 4 shortcut cards
│   │
│   ├── components/
│   │   ├── icons.tsx               # All SVG icon components
│   │   └── layout/
│   │       └── PageShell.tsx       # PageShell wrapper + PageHeader (exported together)
│   │
│   ├── store/
│   │   ├── flow.ts                 # Onboarding state: lang, type, line, quiz result
│   │   ├── session.ts              # Auth state: JWT token + participant profile
│   │   └── settings.ts             # Kiosk settings: theme (dark/light), font size
│   │
│   ├── lib/
│   │   ├── api/
│   │   │   ├── client.ts           # apiClient — base fetch wrapper, auto auth headers
│   │   │   ├── auth.api.ts         # login(), uploadPhoto()
│   │   │   ├── quiz.api.ts         # startQuiz(), submitQuiz()
│   │   │   ├── leaderboard.api.ts  # fetchLeaderboard()
│   │   │   ├── certificate.api.ts  # fetchCertificate()
│   │   │   └── reference.api.ts    # fetchLanguages(), fetchLines(), fetchParticipantTypes()
│   │   ├── hooks/
│   │   │   ├── useAuth.ts          # useLogin, useUploadPhoto (mutations)
│   │   │   ├── useQuiz.ts          # useStartQuiz, useSubmitQuiz (mutations)
│   │   │   ├── useLeaderboard.ts   # useLeaderboard (30s stale time)
│   │   │   ├── useCertificate.ts   # useCertificate (token-gated)
│   │   │   └── useReference.ts     # useLanguages, useLines, useParticipantTypes (Infinity stale)
│   │   └── i18n.ts                 # useTranslation(namespace) hook — EN/KN/HI
│   │
│   ├── constants/
│   │   └── queryKeys.ts            # QUERY_KEYS — typed React Query key constants
│   │
│   └── types/
│       └── api.types.ts            # All API response types (Language, Question, QuizSession, …)
│
├── middleware.ts                   # Route protection — redirects to /login if no auth cookie
├── public/
│   ├── manifest.json               # PWA manifest
│   └── models/                     # face-api.js TinyFaceDetector model files
├── .env.local                      # Local env vars (gitignored)
├── .env.example
├── next.config.ts
├── tailwind.config.ts
└── tsconfig.json
```

---

## Prerequisites

| Tool | Version |
|---|---|
| Node.js | ≥ 20 |
| pnpm | ≥ 9 |
| Backend API | Running on port 3001 (see `apps/backend`) |

---

## Getting Started

**1. Install dependencies** (from monorepo root):

```bash
pnpm install
```

**2. Set up environment variables:**

```bash
cp apps/quiz-app/.env.example apps/quiz-app/.env.local
# Set NEXT_PUBLIC_API_URL if the backend is not on localhost:3001
```

**3. Start the dev server:**

```bash
pnpm --filter quiz-app dev
```

The app is available at `http://localhost:3002`.

> The backend must be running first — the welcome screen fetches languages on load. See `apps/backend/README.md` for backend setup.

---

## Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `NEXT_PUBLIC_API_URL` | | `http://localhost:3001/api` | Backend API base URL. Baked into the client bundle at build time. |

---

## Architecture

### State Management

The app uses three Zustand stores, all persisted to `localStorage`:

| Store | Key | Contents | Lifetime |
|---|---|---|---|
| `useFlowStore` | `flow` | Language, participant type, selected line, last quiz result | Cleared on new session start |
| `useSessionStore` | `session` | JWT token, participant profile | Cleared on logout or expiry |
| `useSettingsStore` | `settings` | Theme (dark/light), font size (sm/md/lg/xl) | Permanent user preference |

**Session store also sets an `auth-token` cookie** (`SameSite=Strict`, max-age 24h). This is what `middleware.ts` reads for route protection — the actual JWT stays in `localStorage` and is never sent to the Next.js server.

**Theme initialisation** is handled by an inline script injected in `layout.tsx` that runs before React hydrates, reading from `localStorage['settings']` directly. This eliminates the flash of unstyled content that would otherwise occur.

---

### API Layer

All backend communication goes through a two-layer structure:

```
Component / Hook
      │
      ▼
lib/hooks/*.ts          — React Query queries & mutations
      │
      ▼
lib/api/*.api.ts        — Domain-specific fetch functions
      │
      ▼
lib/api/client.ts       — apiClient: base fetch wrapper
      │
      ▼
Backend API (NEXT_PUBLIC_API_URL)
```

**`apiClient`** reads the JWT token from `useSessionStore.getState()` at call time (outside of React render) and attaches it as `Authorization: Bearer <token>`. No token prop-drilling or manual header management anywhere in the app.

| `apiClient` method | Auth | Use case |
|---|---|---|
| `get(endpoint)` | JWT | Authenticated GET (certificates) |
| `post(endpoint, body)` | JWT | Authenticated POST (quiz session, submit) |
| `postForm(endpoint, form)` | JWT | Photo upload |
| `publicGet(endpoint)` | None | Reference data, leaderboard |
| `publicPost(endpoint, body)` | None | Login |

**React Query defaults** (set in `providers.tsx`):

| Option | Value | Reason |
|---|---|---|
| `staleTime` | 60 seconds | Prevents unnecessary refetches on tab focus in a kiosk context |
| `retry` | 1 | One retry on network failure — avoids hammering a flaky kiosk network |
| `refetchOnWindowFocus` | `false` | Kiosk screens never go to background |

Reference data (languages, lines, participant types) uses `staleTime: Infinity` — these don't change during a session.

---

### Routing & Auth

Route protection is handled in `middleware.ts`. Protected routes redirect to `/login` if no `auth-token` cookie is present:

| Route | Protected |
|---|---|
| `/` | No |
| `/language` | No |
| `/participant-type` | No |
| `/login` | No |
| `/confirm` | Yes |
| `/photo` | Yes |
| `/menu` | Yes |
| `/quiz`, `/quiz/*` | Yes |
| `/certificate/*` | Yes |
| `/leaderboard` | No |

> The middleware checks only the presence of the cookie, not its validity. The JWT in `localStorage` is validated by the backend on each API call. If the token has expired, API calls return 401 and components handle that error state individually.

All route `page.tsx` files are **thin wrappers** — they contain no logic and simply import the corresponding feature component:

```tsx
// app/quiz/page.tsx
import QuizInstructions from "../features/quiz/QuizInstructions";

export default function QuizPage() {
  return <QuizInstructions />;
}
```

This keeps Next.js routing as the file-system layer while all real logic lives in `features/`.

---

### Internationalisation

`lib/i18n.ts` provides a `useTranslation(namespace)` hook. Translations are co-located in a single file — no external i18n library, no build step. The active language comes from `useFlowStore`.

**Supported languages:** `EN` (English), `KN` (Kannada), `HI` (Hindi)

**Namespaces:** `welcome`, `language`, `participantType`, `login`, `confirm`, `photo`, `menu`, `quiz`, `quizResults`, `leaderboard`

**Usage:**

```tsx
const t = useTranslation("login");
// t.title, t.cta, t.errorInvalid, …
```

Adding a language requires adding its key to each namespace object in `lib/i18n.ts` and adding the language code to the backend seed data.

---

## Screen Reference

| Route | Component | Description |
|---|---|---|
| `/` | `WelcomeScreen` | Landing screen — language switcher, theme/font toggles, start CTA |
| `/language` | `LanguagePicker` | Select EN / KN / HI with native script display |
| `/participant-type` | `ParticipantTypePicker` | Select Employee / Contractor / Trainee |
| `/login` | `LoginForm` | Enter TKM employee code (e.g. `EMP001`) |
| `/confirm` | `ConfirmProfile` | Confirm name, designation, select production line |
| `/photo` | `PhotoCapture` | Webcam capture with TinyFaceDetector overlay — skippable |
| `/menu` | `MenuView` | Hub with quiz CTA and shortcuts to leaderboard, certificates, attempts, profile |
| `/quiz` | `QuizInstructions` | Rules, question count, time limit overview |
| `/quiz/active` | `ActiveQuiz` | Timed quiz — circular countdown, option selection, auto-advance on timeout |
| `/quiz/results/:id` | `QuizResults` | Score ring, performance badge, correct/time/score stats, next actions |
| `/leaderboard` | `LeaderboardView` | Podium (top 3) + ranked table, filter by GLOBAL/DAILY/WEEKLY/MONTHLY |
| `/certificate/:id` | `CertificateView` | Styled certificate card with print and PDF download |

---

## Features Directory

All domain UI logic lives in `app/features/`. Each subdirectory is a self-contained domain:

| Domain | Components | Key dependencies |
|---|---|---|
| `onboarding/` | WelcomeScreen, LanguagePicker, ParticipantTypePicker, PhotoCapture | `store/settings`, `store/flow`, `hooks/useReference` |
| `auth/` | LoginForm, ConfirmProfile | `store/session`, `store/flow`, `hooks/useAuth`, `hooks/useReference` |
| `quiz/` | QuizInstructions, ActiveQuiz, QuizResults | `store/flow`, `store/session`, `hooks/useQuiz` |
| `leaderboard/` | LeaderboardView | `store/flow`, `store/session`, `hooks/useLeaderboard` |
| `certificate/` | CertificateView | `store/session`, `hooks/useCertificate`, `lib/api/client` |
| `menu/` | MenuView | `store/flow`, `lib/i18n` |

**`components/layout/PageShell.tsx`** exports two layout components shared across all features:

- `PageShell` — full-screen kiosk wrapper with consistent padding
- `PageHeader` — top bar with back button (left), brand or page title (center), optional action slot (right)

---

## PWA

The app is configured as a Progressive Web App via `@ducanh2912/next-pwa`.

- **Manifest:** `public/manifest.json` — app name, icons, `display: standalone`, `theme_color: #EB0A1E`
- **Service worker:** Generated automatically on `pnpm build` — caches the UI shell for offline use
- **Installation:** On supported browsers, the OS prompts to install the app to the home screen / taskbar

The face detection models in `public/models/` are pre-cached so face detection works without a network connection.

---

## Scripts

Run from `apps/quiz-app/` or use `pnpm --filter quiz-app <script>` from the monorepo root.

| Script | Description |
|---|---|
| `dev` | Development server with hot reload on `http://localhost:3002` |
| `build` | Production build (also generates the PWA service worker) |
| `start` | Serve the production build |
| `lint` | ESLint (Next.js config) |

---

## Deployment

### Production Build

```bash
# From monorepo root
pnpm --filter quiz-app build
pnpm --filter quiz-app start
```

The app serves on port 3002.

### Production Checklist

- [ ] Set `NEXT_PUBLIC_API_URL` to the production backend URL — this is baked into the JS bundle at build time, so a rebuild is required for any URL change
- [ ] Ensure the backend `ALLOWED_ORIGINS` env var includes the quiz-app's production domain
- [ ] Serve over HTTPS — `SameSite=Strict` cookies and PWA installation both require a secure context
- [ ] Confirm `public/models/` is included in the deployment — face-api.js loads TinyFaceDetector weights from `/models` at runtime
- [ ] For kiosk deployment: set the browser to full-screen / kiosk mode and disable the browser navigation UI

### Kiosk Considerations

- The app is designed for **1280×800 landscape touchscreens** — test on target hardware before deployment
- Session data lives in `localStorage`. If multiple users share one device, `clearSession()` (from `useSessionStore`) must be called on logout to prevent session bleed-through
- Font size and theme preferences are device-level (stored in `localStorage`), not per-user — set appropriate defaults for the kiosk environment in `store/settings.ts`

---

## Contributing

1. Branch off `main` — use `feature/`, `fix/`, or `chore/` prefixes
2. New screens go into `app/features/<domain>/` — the corresponding `page.tsx` should remain a thin wrapper only
3. New API calls: add a fetcher in `lib/api/`, a React Query hook in `lib/hooks/`, and types in `types/api.types.ts`
4. New query keys: add to `constants/queryKeys.ts` — never use inline string arrays in `useQuery` / `useMutation`
5. New translatable strings: add to all three language objects (`EN`, `KN`, `HI`) in `lib/i18n.ts`
6. Run `pnpm lint` and `pnpm build` before opening a PR — both must pass
