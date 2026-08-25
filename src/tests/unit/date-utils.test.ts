import { describe, it, expect } from "vitest";
import {
  startOfDay,
  endOfDay,
  isSameDay,
  formatElapsed,
  formatMinutes,
  greeting,
  addDays,
  startOfWeek,
  monthGridCells,
} from "@/lib/date-utils";

describe("date-utils", () => {
  it("startOfDay zeroes time", () => {
    const d = new Date(2026, 5, 15, 13, 45, 30);
    const s = startOfDay(d);
    expect(s.getHours()).toBe(0);
    expect(s.getMinutes()).toBe(0);
    expect(s.getDate()).toBe(15);
  });

  it("endOfDay is last ms", () => {
    const d = new Date(2026, 5, 15, 10, 0, 0);
    const e = endOfDay(d);
    expect(e.getHours()).toBe(23);
    expect(e.getMinutes()).toBe(59);
    expect(e.getSeconds()).toBe(59);
  });

  it("isSameDay", () => {
    const a = new Date(2026, 0, 1, 10, 0);
    const b = new Date(2026, 0, 1, 22, 30);
    const c = new Date(2026, 0, 2, 0, 0);
    expect(isSameDay(a, b)).toBe(true);
    expect(isSameDay(a, c)).toBe(false);
  });

  it("formatElapsed", () => {
    expect(formatElapsed(0)).toBe("0:00:00");
    expect(formatElapsed(1000)).toBe("0:00:01");
    expect(formatElapsed(3661000)).toBe("1:01:01");
    expect(formatElapsed(2 * 3600 * 1000 + 5 * 60 * 1000 + 9 * 1000)).toBe("2:05:09");
    expect(formatElapsed(-5000)).toBe("0:00:00");
  });

  it("formatMinutes", () => {
    expect(formatMinutes(45)).toBe("45m");
    expect(formatMinutes(60)).toBe("1h");
    expect(formatMinutes(90)).toBe("1h 30m");
    expect(formatMinutes(120)).toBe("2h");
  });

  it("greeting", () => {
    expect(greeting(new Date(2026, 0, 1, 3))).toBe("Working late");
    expect(greeting(new Date(2026, 0, 1, 9))).toBe("Good morning");
    expect(greeting(new Date(2026, 0, 1, 15))).toBe("Good afternoon");
    expect(greeting(new Date(2026, 0, 1, 20))).toBe("Good evening");
  });

  it("addDays", () => {
    const d = new Date(2026, 0, 31);
    const n = addDays(d, 1);
    expect(n.getMonth()).toBe(1);
    expect(n.getDate()).toBe(1);
  });

  it("startOfWeek Monday first", () => {
    // 2026-08-25 is Tuesday
    const tuesday = new Date(2026, 7, 25);
    const monday = startOfWeek(tuesday);
    expect(monday.getDay()).toBe(1);
    expect(monday.getDate()).toBe(24);
    // Sunday should map to previous Monday
    const sunday = new Date(2026, 7, 30);
    expect(startOfWeek(sunday).getDate()).toBe(24);
  });

  it("monthGridCells 42 cells", () => {
    const cells = monthGridCells(new Date(2026, 0, 15));
    expect(cells).toHaveLength(42);
  });
});
