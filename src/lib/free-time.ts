import type { AppState } from "@/services/app-store";
import type { CalendarItem } from "@/lib/calendar-selectors";
import { addDays, startOfDay } from "@/lib/date-utils";

export interface FreeGap {
  /** Minutes from the start of the day. */
  startMin: number;
  endMin: number;
}

export interface DayTimeModel {
  awakeWindows: FreeGap[];
  busyRanges: FreeGap[];
  freeGaps: FreeGap[];
  sleepMinutes: number;
  committedMinutes: number;
  plannedTaskMinutes: number;
  freeMinutes: number;
  nextFreeGap: FreeGap | null;
}

const DAY_MINUTES = 24 * 60;

function timeToMinutes(value: string): number {
  const [h, m] = value.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

/** Sleep ranges in minutes-of-day; wraps midnight when start > end. */
function sleepRanges(sleepStart: string, sleepEnd: string): FreeGap[] {
  const start = timeToMinutes(sleepStart);
  const end = timeToMinutes(sleepEnd);
  if (start === end) return [];
  return start < end
    ? [{ startMin: start, endMin: end }]
    : [
        { startMin: start, endMin: DAY_MINUTES },
        { startMin: 0, endMin: end },
      ];
}

function subtract(
  base: FreeGap,
  cuts: FreeGap[],
  minSize = 15
): FreeGap[] {
  const sorted = [...cuts].sort((a, b) => a.startMin - b.startMin);
  let cursor = base.startMin;
  const out: FreeGap[] = [];
  for (const cut of sorted) {
    if (cut.endMin <= cursor) continue;
    if (cut.startMin > cursor) {
      const gap = { startMin: cursor, endMin: Math.min(cut.startMin, base.endMin) };
      if (gap.endMin - gap.startMin >= minSize) out.push(gap);
    }
    cursor = Math.max(cursor, cut.endMin);
    if (cursor >= base.endMin) break;
  }
  if (cursor < base.endMin) {
    const gap = { startMin: cursor, endMin: base.endMin };
    if (gap.endMin - gap.startMin >= minSize) out.push(gap);
  }
  return out;
}

/**
 * Builds the day's time model per review §4:
 *   24h − sleep − scheduled events − planned task blocks = available free time.
 * `items` must be that day's calendar items (recurring included).
 */
export function getDayTimeModel(
  state: AppState,
  dayStart: Date,
  items: CalendarItem[],
  nowMs: number
): DayTimeModel {
  const { sleepStart, sleepEnd } = state.settings;

  // Awake windows = full day minus sleep.
  const awakeWindows = subtract({ startMin: 0, endMin: DAY_MINUTES }, sleepRanges(sleepStart, sleepEnd), 1);

  // Busy = timed events (incl. linked-task blocks) + activities.
  const busyRanges: FreeGap[] = [];
  for (const item of items) {
    if (item.allDay || item.kind === "task") continue;
    const s = new Date(item.startMs);
    const e = new Date(item.endMs);
    const sameDay = (d: Date) => d.getTime() >= dayStart.getTime() && d.getTime() < dayStart.getTime() + DAY_MINUTES * 60000;
    if (!sameDay(s) && !sameDay(e)) continue;
    const startClamped = sameDay(s)
      ? s.getHours() * 60 + s.getMinutes()
      : 0;
    const endClamped = sameDay(e)
      ? e.getHours() * 60 + e.getMinutes()
      : DAY_MINUTES;
    if (endClamped > startClamped) {
      busyRanges.push({ startMin: startClamped, endMin: endClamped });
    }
  }

  // Free = each awake window minus busy.
  const freeGaps: FreeGap[] = [];
  for (const window of awakeWindows) {
    freeGaps.push(...subtract(window, busyRanges, 15));
  }
  freeGaps.sort((a, b) => a.startMin - b.startMin);

  const sum = (gaps: FreeGap[]) =>
    gaps.reduce((total, gap) => total + (gap.endMin - gap.startMin), 0);

  const isTaskBlock = (item: CalendarItem) =>
    item.kind === "event" && Boolean((item.source as { taskId?: string }).taskId);

  const nextFreeGap =
    freeGaps.find((gap) => dayStart.getTime() + gap.endMin * 60000 > nowMs) ??
    null;

  return {
    awakeWindows,
    busyRanges,
    freeGaps,
    sleepMinutes: DAY_MINUTES - sum(awakeWindows),
    committedMinutes: sum(busyRanges),
    plannedTaskMinutes: items.filter(isTaskBlock).reduce(
      (total, item) => total + Math.round((item.endMs - item.startMs) / 60000),
      0
    ),
    freeMinutes: sum(freeGaps),
    nextFreeGap,
  };
}

/** Tomorrow's model helper (used by suggestions). */
export function getTomorrow(state: AppState, nowMs: number, buildItems: (dayStart: Date) => CalendarItem[]): DayTimeModel {
  const tomorrow = addDays(startOfDay(new Date(nowMs)), 1);
  return getDayTimeModel(state, tomorrow, buildItems(tomorrow), nowMs);
}
