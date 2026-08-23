import type { CalendarItem } from "@/lib/calendar-selectors";
import type { Task } from "@/types";

export interface FreeGap {
  startMin: number;
  endMin: number;
}

/** Default planning window: 08:00 – 22:00. */
export const PLANNER_WINDOW: FreeGap = { startMin: 8 * 60, endMin: 22 * 60 };

const PRIORITY_WEIGHT = { urgent: 4, high: 3, medium: 2, low: 1 } as const;

function busyRanges(items: CalendarItem[]): [number, number][] {
  return items
    .filter((item) => !item.allDay)
    .map((item): [number, number] => [
      minutesOfDay(item.startMs),
      Math.max(minutesOfDay(item.endMs), minutesOfDay(item.startMs) + 1),
    ])
    .sort((a, b) => a[0] - b[0]);
}

function minutesOfDay(ms: number): number {
  const d = new Date(ms);
  return d.getHours() * 60 + d.getMinutes();
}

/** Free intervals inside the planning window after subtracting committed time. */
export function findFreeGaps(
  items: CalendarItem[],
  window: FreeGap = PLANNER_WINDOW
): FreeGap[] {
  const gaps: FreeGap[] = [];
  let cursor = window.startMin;

  for (const [start, end] of busyRanges(items)) {
    if (start > cursor) {
      gaps.push({ startMin: cursor, endMin: Math.min(start, window.endMin) });
    }
    cursor = Math.max(cursor, end);
    if (cursor >= window.endMin) break;
  }
  if (cursor < window.endMin) {
    gaps.push({ startMin: cursor, endMin: window.endMin });
  }

  return gaps.filter((gap) => gap.endMin - gap.startMin >= 5);
}

export function totalMinutes(gaps: FreeGap[]): number {
  return gaps.reduce((sum, gap) => sum + (gap.endMin - gap.startMin), 0);
}

/**
 * Greedy auto-plan: highest-priority tasks first, placed into the earliest
 * free gap that fits their estimate. Deterministic "smart planning" lite.
 */
export function autoPlan(
  tasks: Task[],
  gaps: FreeGap[]
): { taskId: string; startMin: number; endMin: number }[] {
  const sorted = [...tasks].sort((a, b) => {
    const byPriority = PRIORITY_WEIGHT[b.priority] - PRIORITY_WEIGHT[a.priority];
    if (byPriority !== 0) return byPriority;
    return (a.dueDate ?? "").localeCompare(b.dueDate ?? "");
  });

  const remaining: FreeGap[] = [...gaps];
  const placements: { taskId: string; startMin: number; endMin: number }[] = [];

  for (const task of sorted) {
    const duration = Math.max(15, task.estimatedDurationMinutes ?? 30);
    // Earliest gap that fits.
    const gapIndex = remaining.findIndex(
      (gap) => gap.endMin - gap.startMin >= duration
    );
    if (gapIndex === -1) continue;
    const gap = remaining[gapIndex];
    placements.push({
      taskId: task.id,
      startMin: gap.startMin,
      endMin: gap.startMin + duration,
    });
    const rest: FreeGap = {
      startMin: gap.startMin + duration,
      endMin: gap.endMin,
    };
    remaining.splice(gapIndex, 1);
    if (rest.endMin - rest.startMin >= 5) {
      remaining.unshift(rest);
      remaining.sort((a, b) => a.startMin - b.startMin);
    }
  }

  return placements;
}
