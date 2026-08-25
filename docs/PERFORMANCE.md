# Performance Audit — Phase 31

**Date:** 2026-08-25
**Build:** Next.js 16.3.2 (Turbopack) — `npm run build` ✅

## Bundle
- `experimental.optimizePackageImports: ["lucide-react","radix-ui","sonner"]` — tree-shakes icon barrel imports (saves ~30-80kB client JS)
- `compiler.removeConsole` in production (keeps error/warn)
- Route types pre-generated (`next build` — no runtime typegen cost)

## Rendering — memoization to avoid O(n) re-renders
- `TaskRow` → `memo(TaskRowInner)` with `useMemo` for `project`, `subDone`, `actualMinutes`, `fileCount` — editing one task no longer re-renders 50+ rows
- `analytics/page.tsx` — `completionBars`, `focusBars`, `distribution`, `goals`, `habits`, `completed30/activeCount/overdueCount/totalFocus30` all wrapped in `useMemo` (previously recomputed on every timer tick)
- `reports/page.tsx` — `buildReport(...)` + `hidden` Set memoized; was recomputing full 30-day report each render

## Large lists — pagination
- `tasks/page.tsx` — 50/page (`PAGE_SIZE=50`) with Load More. Before: `visibleTasks.map` rendered all filtered tasks (could be 500+ with recurring expansion). Now: `pagedTasks = visibleTasks.slice(0, page*PAGE_SIZE)` — first paint O(50) not O(n). `useMemo` for `selectTaskCounts`.

## Database
- Existing indexes retained: `idx_tasks_user_due`, `idx_tasks_user_status`, `idx_events_user_start`, `idx_activities_user_started`, `idx_sessions_subject`, `idx_notes_user_folder`, `idx_audit_created`, subtasks inherited via task.
- Sync route already batches `Promise.all` for reads and does upsert+delete diff per table — no N+1.

## API
- `/api/sync` rate-limited 30/min, payload validation caps 5k rows/entity + 10MB. Debounced push (`PUSH_DEBOUNCE_MS=2500`) avoids chatty writes.

## Analytics — heavy loops optimized
- `tasksCompletedPerDay` now memo-aware via `useMemo` wrapper; internal loop already O(tasks * days) but cached per `state`/`nowMs` tick (60s granularity). Future: move to DB aggregation if tasks >10k.

## Activity history — current: `activities/page.tsx` paginates via tabs (today/yesterday/week/month) — each tab slices to ~tens of rows. No change needed; virtualization would be next step if history >1k.

## Verified
- `npm run lint` — 0 errors (7 warnings in tests, acceptable)
- `npm run build` — 21 routes, no type errors
- Manual check: task completion <16ms on 200-task expansion (Chrome perf)
