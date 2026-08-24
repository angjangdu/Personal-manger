import type { AppState } from "@/services/app-store";
import type { Project, ProjectStatus } from "@/types";
import { selectGoalProgress } from "@/lib/selectors";

export const PROJECT_STATUS_LABELS: Record<ProjectStatus | "archived", string> = {
  not_started: "Not started",
  active: "Active",
  on_hold: "On hold",
  completed: "Completed",
  archived: "Archived",
};

/**
 * Deadline health (review §11): compares progress against elapsed time.
 * Returns null when no deadline exists.
 */
export function projectDeadlineHealth(
  project: Project,
  percent: number,
  nowMs: number
): { state: "on_track" | "at_risk" | "behind"; message?: string } | null {
  if (!project.deadline) return null;
  const created = new Date(project.createdAt).getTime();
  const deadline = new Date(project.deadline).getTime();
  const window = deadline - created;
  if (window <= 0) return null;
  const elapsed = nowMs - created;
  const timeFraction = Math.min(1, Math.max(0, elapsed / window));
  if (nowMs > deadline) {
    return percent >= 100
      ? { state: "on_track" }
      : { state: "behind", message: "Past deadline" };
  }
  if (timeFraction <= 0.25) return { state: "on_track" };
  // Expected progress = fraction of the window that has passed (softened).
  const expected = timeFraction * 100;
  const delta = percent - expected;
  if (delta < -30) return { state: "behind", message: "Falling behind" };
  if (delta < -15) return { state: "at_risk", message: "At risk" };
  return { state: "on_track" };
}

export type GoalHealth = "on_track" | "at_risk" | "behind" | "no_deadline";

/** Goal health vs remaining time (review §12). */
export function goalHealth(
  state: AppState,
  goal: AppState["goals"][number],
  nowMs: number
): GoalHealth {
  if (!goal.deadline) return "no_deadline";
  const created = new Date(goal.createdAt).getTime();
  const deadline = new Date(goal.deadline).getTime();
  const window = deadline - created;
  if (window <= 0) return "no_deadline";
  const timeFraction = Math.min(1, Math.max(0, (nowMs - created) / window));
  const expected = timeFraction * 100;
  const percent = selectGoalProgress(state, goal);
  const delta = percent - expected;
  if (delta < -30) return "behind";
  if (delta < -15) return "at_risk";
  return "on_track";
}

export const HEALTH_META = {
  on_track: { label: "On track", className: "border-emerald-500/50 text-emerald-600 dark:text-emerald-400" },
  at_risk: { label: "At risk", className: "border-yellow-500/60 text-yellow-700 dark:text-yellow-400" },
  behind: { label: "Behind", className: "border-red-500/50 text-red-600 dark:text-red-400" },
  no_deadline: { label: "", className: "" },
} as const;
