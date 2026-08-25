# Personal OS

A personal productivity and activity-management platform: one connected workspace for goals, projects, tasks, schedules, activities, time tracking, habits, study, notes, and analytics.

Core loop:

```text
Plan → Prioritize → Execute → Track → Review → Improve
```

## Stack

| Layer     | Technology                              |
| --------- | --------------------------------------- |
| Frontend  | Next.js (App Router), React, TypeScript |
| Styling   | Tailwind CSS v4                         |
| Backend   | Next.js server services + Supabase      |
| Database  | PostgreSQL (Supabase)                   |
| Deploy    | Vercel                                  |

## Status

**Frontend freeze (`frontend-freeze-v1`)** — the full user-review improvement cycle is complete: recurring work, calendar time-blocking with move-reasons, free-time calculation, schedule suggestions, activity categories + manual sessions, planned-vs-actual, project/goal health, habit grace flow, study syllabus tracking, reports, global search (⌘K), and a notification center. See [`docs/FREEZE.md`](docs/FREEZE.md).

Current phase: **UX testing**, then backend integration. Authentication/admin remain outside this cycle.

## Getting Started

```bash
npm install
cp .env.example .env.local   # then fill in values as needed
npm run dev                  # http://localhost:3000
```

Other scripts:

```bash
npm run build   # production build
npm run start   # serve production build
npm run lint    # ESLint
```

## Project Structure

```text
src/
├── app/            # App Router pages/routes
├── components/
│   ├── ui/         # design-system primitives
│   └── layout/     # sidebar, topbar, mobile nav
├── services/       # data layer (mock now → Supabase later)
├── hooks/          # reusable React hooks
├── lib/            # framework-agnostic core logic
├── types/          # shared domain types (Task, Project, Goal…)
├── utils/          # pure helpers
└── tests/          # test suites
docs/               # PRD, SRS, UI/UX, architecture, dev plan
```

## Documentation

- [Product Requirements](docs/01_PRD.md)
- [Software Requirements](docs/02_SRS.md)
- [UI/UX Design](docs/03_UI_UX.md)
- [System Architecture](docs/04_SYSTEM_ARCHITECTURE.md)
- [Development Plan](docs/05_DEVELOPMENT_PLAN.md)

## Principles

- Product first — a working demo before authentication or infrastructure.
- Real data over timers — activity duration is computed from timestamps.
- Local persistence in the demo phase; refresh-safe.
