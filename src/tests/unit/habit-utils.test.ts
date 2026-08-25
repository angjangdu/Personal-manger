import { describe, it, expect } from "vitest";
import {
  toDayKey,
  completedDayKeys,
  isHabitDueOn,
  computeStreak,
  bestStreak,
  consistency,
} from "@/lib/habit-utils";
import type { Habit, HabitLog } from "@/types";

function habit(schedule: Habit["schedule"], weekdays?: number[]): Habit {
  return {
    id: "h1",
    name: "Test",
    schedule,
    weekdays,
    archived: false,
    createdAt: new Date().toISOString(),
  };
}

describe("habit-utils", () => {
  it("toDayKey", () => {
    expect(toDayKey(new Date(2026, 0, 5))).toBe("2026-01-05");
    expect(toDayKey(new Date(2026, 11, 15))).toBe("2026-12-15");
  });

  it("isHabitDueOn daily always true", () => {
    const h = habit("daily");
    expect(isHabitDueOn(h, new Date(2026, 7, 25))).toBe(true);
  });

  it("isHabitDueOn weekly respects weekdays", () => {
    const h = habit("weekly", [1, 3, 5]); // Mon, Wed, Fri
    // 2026-08-24 is Monday
    expect(isHabitDueOn(h, new Date(2026, 7, 24))).toBe(true);
    expect(isHabitDueOn(h, new Date(2026, 7, 25))).toBe(false);
    expect(isHabitDueOn(h, new Date(2026, 7, 26))).toBe(true);
  });

  it("computeStreak daily with grace today", () => {
    const h = habit("daily");
    const now = new Date(2026, 7, 25, 10, 0); // Tuesday
    const logs: HabitLog[] = [
      { id: "1", habitId: "h1", completedOn: new Date(2026, 7, 24).toISOString(), createdAt: "" },
      { id: "2", habitId: "h1", completedOn: new Date(2026, 7, 23).toISOString(), createdAt: "" },
    ];
    const keys = completedDayKeys(logs, "h1");
    // Today not completed, yesterday completed => streak 2
    expect(computeStreak(h, keys, now)).toBe(2);
  });

  it("computeStreak respects graceKeys", () => {
    const h = habit("daily");
    const now = new Date(2026, 7, 25);
    const keys = new Set<string>(); // no completions
    const grace = new Set([toDayKey(new Date(2026, 7, 24)), toDayKey(new Date(2026, 7, 23))]);
    // Today not completed -> go to yesterday, 2 graced days => streak 2
    expect(computeStreak(h, keys, now, grace)).toBe(2);
  });

  it("consistency 50% over 2 days", () => {
    const h = habit("daily");
    const now = new Date(2026, 7, 25);
    const logs: HabitLog[] = [
      { id: "1", habitId: "h1", completedOn: new Date(2026, 7, 25).toISOString(), createdAt: "" },
    ];
    const keys = completedDayKeys(logs, "h1");
    // window 2 days: today done, yesterday missed => 50%
    expect(consistency(h, keys, now, 2)).toBe(50);
  });

  it("bestStreak", () => {
    const h = habit("daily");
    const now = new Date(2026, 7, 25);
    const logs: HabitLog[] = [
      { id: "1", habitId: "h1", completedOn: new Date(2026, 7, 25).toISOString(), createdAt: "" },
      { id: "2", habitId: "h1", completedOn: new Date(2026, 7, 24).toISOString(), createdAt: "" },
      { id: "3", habitId: "h1", completedOn: new Date(2026, 7, 20).toISOString(), createdAt: "" },
    ];
    const keys = completedDayKeys(logs, "h1");
    expect(bestStreak(h, keys, now, 10)).toBe(2);
  });
});
