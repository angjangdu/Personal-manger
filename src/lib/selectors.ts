import type { AppState } from "@/services/app-store";
import type { Task, TaskStatus } from "@/types";
import { endOfDay, isSameDay, startOfDay } from "@/lib/date-utils";
import { expandTasks } from "@/lib/recurrence";

/** All visible task instances — recurring templates expanded into occurrences. */
export function selectVisibleTasks(state: AppState, nowMs: number): Task[] {
  return expandTasks({ tasks: state.tasks }, {
    overrides: state.occurrenceOverrides,
    nowMs,
  });
}

const PRIORITY_WEIGHT = { urgent: 4, high: 3, medium: 2, low: 1 } as const;

export type TaskViewKey =
  | "all"
  | "today"
  | "upcoming"
  | "inbox"
  | "completed"
  | "overdue";

export type TaskSortKey = "due" | "priority" | "created" | "title";

/** Active tasks first (by due date, undated last, priority desc), completed/cancelled last. */
export function sortTasksBy(tasks: Task[], key: TaskSortKey = "due"): Task[] {
  const activeFirst = (a: Task, b: Task): number => {
    const aDone = isTerminalStatus(a.status);
    const bDone = isTerminalStatus(b.status);
    if (aDone !== bDone) return aDone ? 1 : -1;
    return 0;
  };
  const byDueDate = (a: Task, b: Task): number => {
    if (a.dueDate && b.dueDate) {
      const byDate = a.dueDate.localeCompare(b.dueDate);
      if (byDate !== 0) return byDate;
    }
    if (a.dueDate !== b.dueDate) return a.dueDate ? -1 : 1;
    return PRIORITY_WEIGHT[b.priority] - PRIORITY_WEIGHT[a.priority];
  };

  return [...tasks].sort((a, b) => {
    const terminal = activeFirst(a, b);
    if (terminal !== 0) return terminal;
    if (isTerminalStatus(a.status)) {
      return (b.completedAt ?? "").localeCompare(a.completedAt ?? "");
    }
    switch (key) {
      case "priority":
        return (
          PRIORITY_WEIGHT[b.priority] - PRIORITY_WEIGHT[a.priority] ||
          byDueDate(a, b)
        );
      case "created":
        return b.createdAt.localeCompare(a.createdAt);
      case "title":
        return a.title.localeCompare(b.title);
      case "due":
      default:
        return byDueDate(a, b);
    }
  });
}

export function selectTasksForView(tasks: Task[], view: TaskViewKey): Task[] {
  const today = startOfDay();
  switch (view) {
    case "today":
      return tasks.filter(
        (task) => task.dueDate && isSameDay(new Date(task.dueDate), today)
      );
    case "upcoming":
      return tasks.filter(
        (task) =>
          task.dueDate &&
          new Date(task.dueDate) > endOfDay(today) &&
          !isTerminalStatus(task.status)
      );
    case "inbox":
      return tasks.filter((task) => task.status === "inbox");
    case "completed":
      return tasks.filter((task) => task.status === "completed");
    case "overdue":
      return tasks.filter(
        (task) =>
          task.dueDate &&
          new Date(task.dueDate) < today &&
          !isTerminalStatus(task.status)
      );
    case "all":
    default:
      return tasks;
  }
}

export interface TaskFilters {
  query?: string;
  projectId?: string;
  tagId?: string;
}

export function filterTasks(
  tasks: Task[],
  filters: TaskFilters,
  context: { projects: AppState["projects"]; tags: AppState["tags"] }
): Task[] {
  const { query = "", projectId = "", tagId = "" } = filters;
  const q = query.trim().toLowerCase();
  if (!q && !projectId && !tagId) return tasks;

  return tasks.filter((task) => {
    if (projectId && task.projectId !== projectId) return false;
    if (tagId && !task.tagIds.includes(tagId)) return false;
    if (!q) return true;
    const project = context.projects.find((p) => p.id === task.projectId);
    const tagNames = context.tags
      .filter((t) => task.tagIds.includes(t.id))
      .map((t) => t.name)
      .join(" ");
    return (
      task.title.toLowerCase().includes(q) ||
      (task.description ?? "").toLowerCase().includes(q) ||
      (project?.name ?? "").toLowerCase().includes(q) ||
      tagNames.toLowerCase().includes(q)
    );
  });
}

export function selectTodaysTasks(state: AppState, nowMs: number): Task[] {
  const today = startOfDay(new Date(nowMs));
  return selectVisibleTasks(state, nowMs).filter(
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
    let completed = tasks.filter((task) => task.status === "completed").length;
    // Recurring completions live in occurrence overrides.
    for (const task of tasks) {
      if (!task.repeat) continue;
      for (const override of Object.values(
        state.occurrenceOverrides[task.id] ?? {}
      )) {
        if (override.done) completed++;
      }
    }
    counts[project.id] = { total: tasks.length, completed };
  }
  return counts;
}

/**
 * Derives goal progress from real work instead of a manual slider:
 * the average of available signals — milestone completion, linked
 * projects' task completion, and directly-linked task completion.
 */
export function selectGoalProgress(state: AppState, goal: AppState["goals"][number]): number {
  const ratios: number[] = [];

  if (goal.milestones.length > 0) {
    ratios.push(
      goal.milestones.filter((m) => m.completedAt).length / goal.milestones.length
    );
  }

  const linkedProjects = state.projects.filter(
    (project) => project.goalId === goal.id && !project.archived
  );
  for (const project of linkedProjects) {
    const tasks = state.tasks.filter((task) => task.projectId === project.id);
    if (tasks.length > 0) {
      ratios.push(
        tasks.filter((task) => task.status === "completed").length / tasks.length
      );
    }
  }

  const directTasks = state.tasks.filter(
    (task) => task.goalId === goal.id &&
      !task.projectId &&
      task.status !== "cancelled"
  );
  if (directTasks.length > 0) {
    ratios.push(
      directTasks.filter((task) => task.status === "completed").length /
        directTasks.length
    );
  }

  if (ratios.length === 0) return 0;
  return Math.round((ratios.reduce((a, b) => a + b, 0) / ratios.length) * 100);
}
