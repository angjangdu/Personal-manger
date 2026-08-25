# Personal OS — Frontend Freeze

**Date:** August 2026
**Tag:** `frontend-freeze-v1`
**Gate:** User Review doc §26 — `P0 FIXES → P1 IMPROVEMENTS → UX TESTING → FRONTEND FREEZE → BACKEND INTEGRATION`

The frontend improvement cycle from the user review is **complete and frozen**. All P0 items are implemented; all P1 items are implemented except notes attachments (deferred — requires backend file storage).

## Verified acceptance criteria

| Review item | Evidence |
|---|---|
| BUG-001 Dashboard→Tasks | Add Task opens the real dialog (`dashboard/page.tsx`); zero stub toasts remain in the codebase |
| Recurring tasks/events (§8) | `lib/recurrence.ts` virtual occurrences + per-occurrence overrides; custom day-picker in both forms |
| Calendar time blocks & views (§9) | Day / 3-Day / Week / Month / Agenda; drag-move with reason capture |
| Free-time calculation (§4) | `lib/free-time.ts` — 24h − sleep (Settings) − events/classes − planned blocks |
| Schedule suggestions (§5) | Planner panel: Accept / Dismiss only, nothing auto-books |
| Planner↔Calendar sync | Same event store — blocks are events |
| Activity tracking (§10) | Start/pause/resume/stop from timestamps; manual past sessions; categories |
| Planned vs actual (§10) | TaskRow chips + Activities tile + Reports comparison |
| Study/syllabus (§14) | Subject→Unit→Topic→Session→Revision; timer auto-records sessions; syllabus bars; report strip |
| Reports (§16) | Weekly/2-week/Monthly: overview, time distribution, planned-vs-actual, reschedule reasons, patterns (peak window, best day), reflections; customizable sections |
| Global search (§17) | ⌘K palette across tasks/events/projects/goals/notes/study/habits |
| Notifications (§17) | Rule-based center: overdue, due today, upcoming event, deadlines, goal health, habits, planning/review nudges, weekly report |
| Mobile (§18) | Bottom nav + More sheet reaches every route; week collapses to day timeline |

## Desired experience (§23) — wiring verified

Open app → Day Brief answers the 3 morning questions → suggestions accept into real blocks → execute with live timer (pauses excluded) → completions flow to progress/analytics/review/reports → reschedule reasons feed the report.

## Known limitations (accepted for freeze)

1. ~~Notes attachments need backend storage.~~ **Superseded (owner-approved unfreeze):** local-first attachments shipped — metadata in the store, blobs in IndexedDB (`services/file-store.ts`, `/files` hub + note editor). Cloud sync lands with the backend.
2. Recurring occurrences move as a series (single-occurrence moves = future).
3. Monthly recurrence skips dates that don't exist (e.g. Jan 31).
4. Habit grace quota is fixed at "excused misses don't break streaks"; configurable quotas are P2.
5. Task dependencies remain P3 per review.
6. Search matches substrings; no fuzzy ranking.

## Deferred to backend phase (per review §26)

Authentication · Admin · Supabase/PostgreSQL persistence (store methods are the swap surface) · file attachments · push notifications (current center is client-computed) · server-side duration authority.

## Freeze rules

Until unfrozen: no new features, no refactors beyond bugfixes found in UX testing. Changes require updating this document's Known Limitations if scope shifts.
