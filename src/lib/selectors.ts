import type { AppState } from "@/services/app-store";
import type { Task, TaskStatus } from "@/types";
import { isSameDay, startOfDay } from "@/lib/date-utils";

const PRIORITY_WEIGHT = { urgent: 4, high: 3, medium: 2, low: 1 } as const;

/** Active tasks first (by due date, undated last, priority desc), completed/cancelled last. */
export function sortTasks(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => {
    const aDone = a.status === "completed" || a.status === "cancelled";
    const bDone = b.status === "completed" || b.status === "cancelled";
    if (aDone !== bDone) return aDone ? 1 : -1;
    if (aDone && bDone) {
      return (b.completedAt ?? "").localeCompare(a.completedAt ?? "");
    }
    if (a.dueDate && b.dueDate) {
      const byDate = a.dueDate.localeCompare(b.dueDate);
      if (byDate !== 0) return byDate;
    }
    if (a.dueDate !== b.dueDate) return a.dueDate ? -1 : 1;
    return (
      PRIORITY_WEIGHT[b.priority] - PRIORITY_WEIGHT[a.priority] ||
      a.createdAt.localeCompare(b.createdAt)
    );
  });
}

export function selectTodaysTasks(state: AppState): Task[] {
  const today = startOfDay();
  return state.tasks.filter(
    (task) => task.dueDate && isSameDay(new Date(task.dueDate), today)
  );
}

export function selectTaskCounts(tasks: Task[]) {
  const active = tasks.filter(
    (task) => task.status !== "completed" && task.status !== "cancelled"
  ).length;
  const done = tasks.filter((task) => task.status === "completed").length;
  return { total: tasks.length, done, active };
}

export function isTerminalStatus(status: TaskStatus): boolean {
  return status === "completed" || status === "cancelled";
}

export function selectFocusMinutesToday(state: AppState): number {
  const today = startOfDay();
  return state.activities
    .filter(
      (activity) =>
        activity.endedAt && isSameDay(new Date(activity.startedAt), today)
    )
    .reduce((sum, activity) => sum + (activity.durationMinutes ?? 0), 0);
}

export function selectProjectTaskCounts(state: AppState) {
  const counts: Record<string, { total: number; completed: number }> = {};
  for (const project of state.projects) {
    const tasks = state.tasks.filter((task) => task.projectId === project.id);
    counts[project.id] = {
      total: tasks.length,
      completed: tasks.filter((task) => task.status === "completed").length,
    };
  }
  return counts;
}
