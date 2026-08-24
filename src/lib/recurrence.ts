import type {
  CalendarEvent,
  OccurrenceOverride,
  RecurrenceRule,
  Task,
} from "@/types";
import { addDays, startOfDay } from "@/lib/date-utils";
import { toDayKey } from "@/lib/habit-utils";

/** Virtual instance ids look like `<templateId>#<YYYY-MM-DD>`. */
export function virtualId(templateId: string, dateKey: string): string {
  return `${templateId}#${dateKey}`;
}

export function parseVirtualId(
  id: string
): { templateId: string; dateKey: string } | null {
  const idx = id.indexOf("#");
  if (idx === -1) return null;
  return { templateId: id.slice(0, idx), dateKey: id.slice(idx + 1) };
}

const DAY_MS = 86400000;

function mondayStart(date: Date): Date {
  const d = startOfDay(date);
  const day = d.getDay();
  return addDays(d, day === 0 ? -6 : 1 - day);
}

function weeksBetween(a: Date, b: Date): number {
  return Math.round(
    (mondayStart(b).getTime() - mondayStart(a).getTime()) / (7 * DAY_MS)
  );
}

/** Does the rule produce an occurrence on `date`, given the series anchor? */
export function occursOn(
  rule: RecurrenceRule,
  anchor: Date,
  date: Date
): boolean {
  const a = startOfDay(anchor);
  const d = startOfDay(date);
  if (d.getTime() < a.getTime()) return false;

  switch (rule.freq) {
    case "daily":
      return true;
    case "weekdays": {
      const dow = d.getDay();
      return dow >= 1 && dow <= 5;
    }
    case "custom":
      return rule.weekdays?.includes(d.getDay()) ?? false;
    case "weekly":
      return (
        a.getDay() === d.getDay() && weeksBetween(a, d) % 1 === 0
      );
    case "biweekly":
      return (
        a.getDay() === d.getDay() &&
        Math.abs(weeksBetween(a, d)) % 2 === 0
      );
    case "monthly":
      return a.getDate() === d.getDate();
    case "yearly":
      return a.getMonth() === d.getMonth() && a.getDate() === d.getDate();
    default:
      return false;
  }
}

/** Generation window: recent past for catch-up, bounded future. */
const PAST_DAYS = 31;
const FUTURE_DAYS = 60;

interface ExpandOptions {
  overrides: Record<string, Record<string, OccurrenceOverride>> | undefined;
  nowMs: number;
  /** Hide occurrences before this timestamp (defaults to window start). */
  fromMs?: number;
}

/**
 * Expands recurring templates into independent virtual occurrences and
 * returns the full visible task list (non-recurring tasks pass through).
 * Recurring templates themselves are hidden — their occurrences represent them.
 */
export function expandTasks(state: {
  tasks: Task[];
}, options: ExpandOptions): Task[] {
  const { overrides, nowMs } = options;
  const lo = Math.max(
    addDays(startOfDay(new Date(nowMs)), -PAST_DAYS).getTime(),
    options.fromMs ?? 0
  );
  const hi = addDays(startOfDay(new Date(nowMs)), FUTURE_DAYS).getTime();

  const out: Task[] = [];
  for (const task of state.tasks) {
    if (!task.repeat) {
      out.push(task);
      continue;
    }
    const anchor = task.dueDate
      ? startOfDay(new Date(task.dueDate))
      : startOfDay(new Date(nowMs));
    const templateOverrides = overrides?.[task.id];

    for (let ms = lo; ms <= hi; ms += DAY_MS) {
      const day = new Date(ms);
      if (!occursOn(task.repeat, anchor, day)) continue;

      const key = toDayKey(day);
      const ov: OccurrenceOverride | undefined = templateOverrides?.[key];
      if (ov?.skipped) continue;

      const dueDate = combineDateAndTime(day, task.dueTime);
      out.push({
        ...task,
        subtasks: [],
        id: virtualId(task.id, key),
        dueDate,
        status: ov?.done
          ? "completed"
          : task.status === "completed"
            ? "planned"
            : task.status,
        completedAt: ov?.completedAt,
        virtual: { templateId: task.id, dateKey: key },
      });
    }
  }
  return out;
}

function combineDateAndTime(day: Date, time?: string): string | undefined {
  if (!time) return undefined;
  const [h, m] = time.split(":").map(Number);
  const d = new Date(day);
  d.setHours(h || 0, m || 0, 0, 0);
  return d.toISOString();
}

/**
 * Expands recurring calendar events into concrete instances over the window.
 * Events don't need per-occurrence overrides in v1 — missed classes are just
 * history.
 */
export function expandEvents(
  events: CalendarEvent[],
  nowMs: number,
  rangeStartMs?: number,
  rangeEndMs?: number
): CalendarEvent[] {
  const out: CalendarEvent[] = [];
  const lo =
    rangeStartMs !== undefined
      ? Math.max(rangeStartMs, addDays(startOfDay(new Date(nowMs)), -PAST_DAYS).getTime())
      : addDays(startOfDay(new Date(rangeStartMs ?? nowMs)), -PAST_DAYS).getTime();
  const hi =
    rangeEndMs !== undefined
      ? Math.min(rangeEndMs, addDays(startOfDay(new Date(nowMs)), FUTURE_DAYS).getTime())
      : addDays(startOfDay(new Date(nowMs)), FUTURE_DAYS).getTime();

  for (const event of events) {
    if (!event.repeat) {
      out.push(event);
      continue;
    }
    const anchor = new Date(event.startAt);
    const durationMs =
      new Date(event.endAt).getTime() - anchor.getTime();

    // Iterate days of the expansion window (never before the anchor's day).
    const from = Math.max(lo, startOfDay(anchor).getTime());
    for (let ms = from; ms <= hi; ms += DAY_MS) {
      const day = new Date(ms);
      if (!occursOn(event.repeat, anchor, day)) continue;
      const [h, mi] = [anchor.getHours(), anchor.getMinutes()];
      const start = new Date(day);
      start.setHours(h, mi, 0, 0);
      out.push({
        ...event,
        id: virtualId(event.id, toDayKey(day)),
        startAt: start.toISOString(),
        endAt: new Date(start.getTime() + durationMs).toISOString(),
      });
    }
  }
  return out;
}
