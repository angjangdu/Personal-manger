import type { Habit, HabitLog } from "@/types";
import { addDays, isSameDay, startOfDay } from "@/lib/date-utils";

export function toDayKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Set of "YYYY-MM-DD" day keys a habit was completed on. */
export function completedDayKeys(logs: HabitLog[], habitId: string): Set<string> {
  const keys = new Set<string>();
  for (const log of logs) {
    if (log.habitId === habitId) keys.add(toDayKey(new Date(log.completedOn)));
  }
  return keys;
}

/** JS getDay() convention: 0=Sun … 6=Sat. */
export function isHabitDueOn(habit: Habit, date: Date): boolean {
  if (habit.schedule === "daily") return true;
  return habit.weekdays?.includes(date.getDay()) ?? true;
}

export function isCompletedOn(keys: Set<string>, date: Date): boolean {
  return keys.has(toDayKey(date));
}

/**
 * Current streak = consecutive due days completed, counting backwards.
 * Today gets grace: an incomplete today doesn't break the streak if
 * yesterday's due day was completed. Streaks are a signal, not a score —
 * pair with consistency().
 */
export function computeStreak(
  habit: Habit,
  keys: Set<string>,
  now: Date
): number {
  let cursor = startOfDay(now);
  // Grace for today.
  if (isHabitDueOn(habit, cursor) && !isCompletedOn(keys, cursor)) {
    cursor = addDays(cursor, -1);
  }
  let streak = 0;
  for (let i = 0; i < 366; i++) {
    if (!isHabitDueOn(habit, cursor)) {
      cursor = addDays(cursor, -1);
      continue;
    }
    if (isCompletedOn(keys, cursor)) {
      streak++;
      cursor = addDays(cursor, -1);
    } else {
      break;
    }
  }
  return streak;
}

/** Longest run of completed due days within the lookback window ending yesterday. */
export function bestStreak(
  habit: Habit,
  keys: Set<string>,
  now: Date,
  lookbackDays = 180
): number {
  let best = 0;
  let run = 0;
  let cursor = startOfDay(now);
  for (let i = 0; i < lookbackDays; i++) {
    if (isHabitDueOn(habit, cursor)) {
      if (isCompletedOn(keys, cursor)) {
        run++;
        best = Math.max(best, run);
      } else if (!isSameDay(cursor, startOfDay(now))) {
        run = 0;
      }
    }
    cursor = addDays(cursor, -1);
  }
  return best;
}

/**
 * Consistency over the last N due days (default 30): percentage completed.
 * The counter-balance to streaks per UI/UX doc §9.
 */
export function consistency(
  habit: Habit,
  keys: Set<string>,
  now: Date,
  windowDays = 30
): number {
  let due = 0;
  let done = 0;
  let cursor = startOfDay(now);
  for (let i = 0; i < windowDays; i++) {
    if (isHabitDueOn(habit, cursor)) {
      due++;
      if (isCompletedOn(keys, cursor)) done++;
    }
    cursor = addDays(cursor, -1);
  }
  return due === 0 ? 0 : Math.round((done / due) * 100);
}
