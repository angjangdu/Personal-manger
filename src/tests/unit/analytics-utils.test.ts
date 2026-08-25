/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect } from "vitest";
import { tasksCompletedPerDay, focusMinutesPerDay } from "@/lib/analytics-utils";
import type { AppState } from "@/services/app-store";

function baseState(overrides: Partial<AppState> = {}): AppState {
  return {
    tasks: [],
    projects: [],
    goals: [],
    habits: [],
    habitLogs: [],
    habitGraceLogs: [],
    activities: [],
    calendarEvents: [],
    tags: [],
    studySubjects: [],
    studyTopics: [],
    studySessions: [],
    notes: [],
    dailyReviews: [],
    rescheduleLogs: [],
    attachments: [],
    occurrenceOverrides: {},
    settings: { sleepStart: "23:00", sleepEnd: "07:00" },
    ...overrides,
  } as AppState;
}

describe("analytics-utils", () => {
  it("tasksCompletedPerDay", () => {
    const now = new Date(2026, 7, 25, 12, 0).getTime();
    const state = baseState({
      tasks: [
        {
          id: "1",
          title: "Done today",
          status: "completed",
          priority: "medium",
          tagIds: [],
          subtasks: [],
          completedAt: new Date(2026, 7, 25, 10, 0).toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        } as any,
      ],
    });
    const result = tasksCompletedPerDay(state, 1, now);
    expect(result).toHaveLength(1);
    expect(result[0].value).toBe(1);
  });

  it("focusMinutesPerDay counts ended activities", () => {
    const now = new Date(2026, 7, 25, 12, 0).getTime();
    const state = baseState({
      activities: [
        {
          id: "a1",
          title: "Focus",
          startedAt: new Date(2026, 7, 25, 9, 0).toISOString(),
          endedAt: new Date(2026, 7, 25, 10, 0).toISOString(),
          totalPausedMs: 0,
          durationMinutes: 60,
          createdAt: new Date().toISOString(),
        } as any,
      ],
    });
    const result = focusMinutesPerDay(state, 1, now);
    expect(result[0].value).toBe(60);
  });

  it("focusMinutesPerDay includes running activity today", () => {
    const now = new Date(2026, 7, 25, 12, 0).getTime();
    const state = baseState({
      activities: [
        {
          id: "a1",
          title: "Running",
          startedAt: new Date(2026, 7, 25, 11, 0).toISOString(),
          totalPausedMs: 0,
          createdAt: new Date().toISOString(),
        } as any,
      ],
    });
    const result = focusMinutesPerDay(state, 1, now);
    expect(result[0].value).toBe(60);
  });
});
