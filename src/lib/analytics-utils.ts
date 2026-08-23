import type { AppState } from "@/services/app-store";
import { addDays, isSameDay, startOfDay } from "@/lib/date-utils";
import { selectGoalProgress } from "@/lib/selectors";
import {
  completedDayKeys,
  consistency,
} from "@/lib/habit-utils";

export interface DayValue {
  label: string;
  value: number;
}

/** Tasks completed per day for the last `days` days (by completedAt). */
export function tasksCompletedPerDay(
  state: AppState,
  days: number,
  nowMs: number
): DayValue[] {
  const out: DayValue[] = [];
  const today = startOfDay(new Date(nowMs));
  for (let i = days - 1; i >= 0; i--) {
    const day = addDays(today, -i);
    const value = state.tasks.filter(
      (t) => t.completedAt && isSameDay(new Date(t.completedAt), day)
    ).length;
    out.push({ label: String(day.getDate()), value });
  }
  return out;
}

/** Focus minutes per day from activities (running ones count live time today). */
export function focusMinutesPerDay(
  state: AppState,
  days: number,
  nowMs: number
): DayValue[] {
  const out: DayValue[] = [];
  const today = startOfDay(new Date(nowMs));
  for (let i = days - 1; i >= 0; i--) {
    const day = addDays(today, -i);
    let minutes = 0;
    for (const activity of state.activities) {
      if (!isSameDay(new Date(activity.startedAt), day)) continue;
      if (activity.endedAt) {
        minutes += activity.durationMinutes ?? 0;
      } else if (isSameDay(day, new Date(nowMs))) {
        minutes += Math.round(
          (nowMs -
            new Date(activity.startedAt).getTime() -
            activity.totalPausedMs) /
            60000
        );
      }
    }
    out.push({ label: String(day.getDate()), value: minutes });
  }
  return out;
}

export interface DistributionSlice {
  label: string;
  value: number;
  color: string;
}

/** Focus-time distribution by project over the last `days` days. */
export function focusDistributionByProject(
  state: AppState,
  days: number,
  nowMs: number
): DistributionSlice[] {
  const since = addDays(startOfDay(new Date(nowMs)), -(days - 1)).getTime();
  const totals = new Map<string, number>();
  for (const activity of state.activities) {
    const started = new Date(activity.startedAt).getTime();
    if (started < since) continue;
    const key = activity.projectId ?? "__none__";
    totals.set(key, (totals.get(key) ?? 0) + (activity.durationMinutes ?? 0));
  }

  const slices: DistributionSlice[] = [];
  let other = 0;
  for (const [projectId, value] of totals) {
    if (value <= 0) continue;
    const project = state.projects.find((p) => p.id === projectId);
    if (project && project.color) {
      slices.push({ label: project.name, value, color: project.color });
    } else {
      other += value;
    }
  }
  slices.sort((a, b) => b.value - a.value);
  // Keep top 5 named + "Other".
  while (slices.length > 5) {
    other += slices.pop()!.value;
  }
  if (other > 0) {
    slices.push({
      label: "Unlinked / other",
      value: other,
      color: "var(--muted-foreground)",
    });
  }
  return slices;
}

export function goalProgressRows(state: AppState) {
  return state.goals
    .filter((g) => !g.archived)
    .map((goal) => ({
      id: goal.id,
      title: goal.title,
      percent: selectGoalProgress(state, goal),
      deadline: goal.deadline,
    }))
    .sort((a, b) => b.percent - a.percent);
}

export function habitConsistencyRows(state: AppState, nowMs: number) {
  const now = new Date(nowMs);
  return state.habits
    .filter((h) => !h.archived)
    .map((habit) => ({
      id: habit.id,
      name: habit.name,
      percent: consistency(habit, completedDayKeys(state.habitLogs, habit.id), now),
      streak: 0, // streak shown separately where needed
    }))
    .sort((a, b) => b.percent - a.percent);
}
