import type { AppState } from "@/services/app-store";
import type {
  Activity,
  CalendarEvent,
  EventCategory,
  Task,
} from "@/types";
import { isSameDay } from "@/lib/date-utils";
import { expandEvents, expandTasks } from "@/lib/recurrence";

export type CalendarItemKind = "event" | "task" | "activity";

export interface CalendarItem {
  kind: CalendarItemKind;
  id: string;
  title: string;
  /** Absolute epoch ms. */
  startMs: number;
  endMs: number;
  allDay: boolean;
  /** Tailwind classes for block styling per kind/status. */
  className: string;
  done?: boolean;
  running?: boolean;
  category?: EventCategory;
  source: CalendarEvent | Task | Activity;
}

const DEFAULT_TASK_BLOCK_MINUTES = 30;
const RUNNING_ACTIVITY_MIN_MINUTES = 15;

export const EVENT_CATEGORY_CLASSES: Record<EventCategory, string> = {
  general: "bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/40",
  class: "bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-500/40",
  work: "bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/40",
  study: "bg-teal-500/15 text-teal-700 dark:text-teal-300 border-teal-500/40",
  project: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/40",
  personal: "bg-pink-500/15 text-pink-700 dark:text-pink-300 border-pink-500/40",
};

const TASK_CLASSES =
  "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/40";
const TASK_DONE_CLASSES =
  "bg-emerald-500/5 text-emerald-700/60 dark:text-emerald-300/50 border-emerald-500/20 line-through";
const TASK_OVERDUE_CLASSES =
  "bg-red-500/15 text-red-700 dark:text-red-300 border-red-500/50";
const ACTIVITY_CLASSES =
  "bg-violet-500/10 text-violet-700 dark:text-violet-300 border-violet-500/30";
const ACTIVITY_RUNNING_CLASSES =
  "bg-violet-500/25 text-violet-800 dark:text-violet-200 border-violet-500/60 animate-pulse";

/**
 * Unifies events, timed tasks/deadlines, and activities into renderable
 * blocks overlapping [rangeStart, rangeEnd]. `nowMs` is injected so the
 * selector stays pure (running activities get a live end).
 */
export function selectCalendarItems(
  state: AppState,
  rangeStart: Date,
  rangeEnd: Date,
  nowMs: number
): CalendarItem[] {
  const startMs = rangeStart.getTime();
  const endMs = rangeEnd.getTime();
  const items: CalendarItem[] = [];

  // Recurring templates expand into concrete occurrences for this range.
  const events = expandEvents(
    state.calendarEvents,
    nowMs,
    startMs,
    endMs
  ) as CalendarEvent[];
  const tasks = expandTasks({ tasks: state.tasks }, {
    overrides: state.occurrenceOverrides,
    nowMs,
    fromMs: startMs,
  }) as Task[];

  for (const event of events) {
    const s = new Date(event.startAt).getTime();
    const e = event.allDay ? s : new Date(event.endAt).getTime();
    if (s > endMs || e < startMs) continue;
    const category = event.category ?? "general";
    items.push({
      kind: "event",
      id: event.id,
      title: event.title,
      startMs: Math.max(s, startMs),
      endMs: Math.min(Math.max(e, s + 60000), endMs),
      allDay: event.allDay,
      className: EVENT_CATEGORY_CLASSES[category],
      category,
      source: event,
    });
  }

  for (const task of tasks) {
    if (!task.dueDate) continue;
    const dueMs = new Date(task.dueDate).getTime();
    if (dueMs < startMs || dueMs > endMs) continue;

    const terminal = task.status === "completed" || task.status === "cancelled";
    const timed = Boolean(task.dueTime);
    let start: number;
    if (timed && task.dueTime) {
      const d = new Date(dueMs);
      const [h, m] = task.dueTime.split(":").map(Number);
      d.setHours(h || 0, m || 0, 0, 0);
      start = d.getTime();
    } else {
      start = dueMs;
    }
    if (start > endMs) continue;

    const blockMinutes =
      task.estimatedDurationMinutes ?? DEFAULT_TASK_BLOCK_MINUTES;
    const end = timed
      ? start + Math.max(15, blockMinutes) * 60000
      : start + 86399999;

    const overdue = !terminal && timed && start < nowMs;
    items.push({
      kind: "task",
      id: task.id,
      title: task.title,
      startMs: start,
      endMs: end,
      allDay: !timed,
      className: terminal
        ? TASK_DONE_CLASSES
        : overdue
          ? TASK_OVERDUE_CLASSES
          : TASK_CLASSES,
      done: terminal,
      source: task,
    });
  }

  for (const activity of state.activities) {
    const s = new Date(activity.startedAt).getTime();
    const ended = activity.endedAt
      ? new Date(activity.endedAt).getTime()
      : Math.max(
          s + RUNNING_ACTIVITY_MIN_MINUTES * 60000,
          nowMs - activity.totalPausedMs
        );
    if (s > endMs || ended < startMs) continue;
    const running = !activity.endedAt;
    items.push({
      kind: "activity",
      id: activity.id,
      title: activity.title,
      startMs: s,
      endMs: ended,
      allDay: false,
      className: running ? ACTIVITY_RUNNING_CLASSES : ACTIVITY_CLASSES,
      running,
      source: activity,
    });
  }

  return items.sort((a, b) => a.startMs - b.startMs);
}

/** Untimed (deadline-only) tasks falling on a specific day. */
export function selectAllDayTasksForDay(state: AppState, day: Date): Task[] {
  return state.tasks.filter((task) => {
    if (!task.dueDate || task.dueTime) return false;
    return isSameDay(new Date(task.dueDate), day);
  });
}
