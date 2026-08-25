import { describe, it, expect } from "vitest";
import { sortTasksBy, selectGoalProgress, isTerminalStatus } from "@/lib/selectors";
import type { Task, Goal } from "@/types";
import type { AppState } from "@/services/app-store";

function task(partial: Partial<Task> & { id: string; title: string }): Task {
  return {
    status: "planned",
    priority: "medium",
    tagIds: [],
    subtasks: [],
    createdAt: new Date(2026, 0, 1).toISOString(),
    updatedAt: new Date(2026, 0, 1).toISOString(),
    ...partial,
  } as Task;
}

describe("selectors - isTerminalStatus", () => {
  it("completed and cancelled are terminal", () => {
    expect(isTerminalStatus("completed")).toBe(true);
    expect(isTerminalStatus("cancelled")).toBe(true);
    expect(isTerminalStatus("planned")).toBe(false);
    expect(isTerminalStatus("inbox")).toBe(false);
  });
});

describe("sortTasksBy", () => {
  it("active before completed", () => {
    const a = task({ id: "1", title: "Active", status: "planned", priority: "high" });
    const b = task({ id: "2", title: "Done", status: "completed", priority: "low" });
    const sorted = sortTasksBy([b, a], "due");
    expect(sorted[0].id).toBe("1");
  });

  it("sort by priority", () => {
    const low = task({ id: "1", title: "Low", priority: "low" });
    const urgent = task({ id: "2", title: "Urgent", priority: "urgent" });
    const sorted = sortTasksBy([low, urgent], "priority");
    expect(sorted[0].id).toBe("2");
  });

  it("sort by title", () => {
    const b = task({ id: "1", title: "Banana" });
    const a = task({ id: "2", title: "Apple" });
    const sorted = sortTasksBy([b, a], "title");
    expect(sorted[0].title).toBe("Apple");
  });
});

describe("selectGoalProgress", () => {
  it("returns 0 when no signals", () => {
    const goal: Goal = {
      id: "g1",
      title: "Test",
      milestones: [],
      projectIds: [],
      progressPercent: 0,
      archived: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const state = {
      goals: [goal],
      projects: [],
      tasks: [],
    } as unknown as AppState;
    expect(selectGoalProgress(state, goal)).toBe(0);
  });

  it("100% when milestones completed", () => {
    const goal: Goal = {
      id: "g1",
      title: "Test",
      milestones: [
        { id: "m1", goalId: "g1", title: "M1", completedAt: new Date().toISOString(), createdAt: new Date().toISOString() },
        { id: "m2", goalId: "g1", title: "M2", completedAt: new Date().toISOString(), createdAt: new Date().toISOString() },
      ],
      projectIds: [],
      progressPercent: 0,
      archived: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const state = { goals: [goal], projects: [], tasks: [] } as unknown as AppState;
    expect(selectGoalProgress(state, goal)).toBe(100);
  });

  it("50% when half milestones done", () => {
    const goal: Goal = {
      id: "g1",
      title: "Test",
      milestones: [
        { id: "m1", goalId: "g1", title: "M1", completedAt: new Date().toISOString(), createdAt: new Date().toISOString() },
        { id: "m2", goalId: "g1", title: "M2", createdAt: new Date().toISOString() },
      ],
      projectIds: [],
      progressPercent: 0,
      archived: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const state = { goals: [goal], projects: [], tasks: [] } as unknown as AppState;
    expect(selectGoalProgress(state, goal)).toBe(50);
  });
});
