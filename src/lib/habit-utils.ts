import type { Habit, HabitGraceLog, HabitLog } from "@/types";
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

/** Day keys excused via the grace flow — don't break streaks. */
export function graceDayKeys(
  logs: HabitGraceLog[],
  habitId: string
): Set<string> {
  const keys = new Set<string>();
  for (const log of logs) {
    if (log.habitId === habitId) keys.add(log.dateKey);
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
 * Current streak = consecutive due days completed or excused (grace),
 * counting backwards. Today gets grace. Unexcused misses beyond the
 * rolling quota break the streak (review §13).
 */
export function computeStreak(
  habit: Habit,
  keys: Set<string>,
  now: Date,
  graceKeys: Set<string> = new Set()
): number {
  let cursor = startOfDay(now);
  if (isHabitDueOn(habit, cursor) && !isCompletedOn(keys, cursor)) {
    cursor = addDays(cursor, -1);
  }
  let streak = 0;
  for (let i = 0; i < 366; i++) {
    const key = toDayKey(cursor);
    if (!isHabitDueOn(habit, cursor)) {
      cursor = addDays(cursor, -1);
      continue;
    }
    if (isCompletedOn(keys, cursor) || graceKeys.has(key)) {
      streak++;
      cursor = addDays(cursor, -1);
    } else {
      break;
    }
  }
  return streak;
}

/** Unexcused misses in the last N due days — drives the warning state. */
export function unexcusedMisses(
  habit: Habit,
  keys: Set<string>,
  graceKeys: Set<string>,
  now: Date,
  dueDaysWindow = 7
): number {
  let misses = 0;
  let countedDue = 0;
  let cursor = addDays(startOfDay(now), -1); // today handled separately
  for (let i = 0; i < 60 && countedDue < dueDaysWindow; i++) {
    if (isHabitDueOn(habit, cursor)) {
      countedDue++;
      const key = toDayKey(cursor);
      if (!isCompletedOn(keys, cursor) && !graceKeys.has(key)) misses++;
    }
    cursor = addDays(cursor, -1);
  }
  return misses;
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
