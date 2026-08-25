import type { AppState } from "@/services/app-store";
import { selectVisibleTasks } from "@/lib/selectors";
import { selectCalendarItems } from "@/lib/calendar-selectors";
import { goalHealth } from "@/lib/health-utils";
import {
  completedDayKeys,
  isCompletedOn,
  isHabitDueOn,
  toDayKey,
} from "@/lib/habit-utils";
import { isSameDay, startOfDay } from "@/lib/date-utils";

export type NotificationSeverity = "info" | "warn" | "urgent";

export interface AppNotification {
  id: string;
  severity: NotificationSeverity;
  title: string;
  detail?: string;
  href: string;
  /** When the underlying thing happens — used for "new since last open". */
  atMs: number;
}

const HOUR = 3600000;
const DAY = 86400000;

/** Rule-based notification generator (review §17). Pure. */
export function buildNotifications(
  state: AppState,
  nowMs: number
): AppNotification[] {
  const items: AppNotification[] = [];
  const now = new Date(nowMs);
  const today = startOfDay(now);
  const hour = now.getHours();

  // ── Overdue tasks (top 3) ──
  const overdue = selectVisibleTasks(state, nowMs)
    .filter(
      (t) =>
        t.dueDate &&
        new Date(t.dueDate).getTime() < nowMs &&
        t.status !== "completed" &&
        t.status !== "cancelled" &&
        !t.skipped
    )
    .sort((a, b) => a.dueDate!.localeCompare(b.dueDate!));
  overdue.slice(0, 3).forEach((task) => {
    items.push({
      id: `overdue-${task.id}`,
      severity: "urgent",
      title: `Overdue: ${task.title}`,
      detail: `Was due ${new Date(task.dueDate!).toLocaleDateString()}`,
      href: "/tasks",
      atMs: new Date(task.dueDate!).getTime(),
    });
  });
  if (overdue.length > 3) {
    items.push({
      id: "overdue-more",
      severity: "warn",
      title: `${overdue.length - 3} more overdue tasks`,
      href: "/tasks",
      atMs: today.getTime(),
    });
  }

  // ── Due today ──
  const dueToday = selectVisibleTasks(state, nowMs).filter(
    (t) =>
      t.dueDate &&
      isSameDay(new Date(t.dueDate), today) &&
      t.status !== "completed" &&
      t.status !== "cancelled"
  );
  if (dueToday.length > 0) {
    items.push({
      id: `due-today-${toDayKey(today)}`,
      severity: "warn",
      title: `${dueToday.length} task${dueToday.length > 1 ? "s" : ""} due today`,
      detail: dueToday
        .slice(0, 2)
        .map((t) => t.title)
        .join(", "),
      href: "/tasks",
      atMs: today.getTime(),
    });
  }

  // ── Next event within the hour ──
  const dayEnd = new Date(today.getTime() + DAY - 1).toISOString();
  const upcoming = selectCalendarItems(state, today, new Date(dayEnd), nowMs)
    .filter((i) => !i.allDay && i.startMs > nowMs && i.startMs <= nowMs + 2 * HOUR)
    .sort((a, b) => a.startMs - b.startMs)[0];
  if (upcoming) {
    const minutes = Math.round((upcoming.startMs - nowMs) / 60000);
    items.push({
      id: `event-${upcoming.id}`,
      severity: minutes <= 15 ? "urgent" : "info",
      title: `Upcoming: ${upcoming.title}`,
      detail: `In ${minutes} min`,
      href: "/calendar",
      atMs: upcoming.startMs,
    });
  }

  // ── Project deadlines within 3 days ──
  for (const project of state.projects) {
    if (project.archived || project.status === "completed") continue;
    if (!project.deadline) continue;
    const until = new Date(project.deadline).getTime() - nowMs;
    if (until > 0 && until <= 3 * DAY) {
      items.push({
        id: `project-deadline-${project.id}`,
        severity: until <= DAY ? "urgent" : "warn",
        title: `Deadline: ${project.name}`,
        detail:
          until <= DAY
            ? "Due within 24 hours"
            : `Due in ${Math.ceil(until / DAY)} days`,
        href: `/projects/${project.id}`,
        atMs: new Date(project.deadline).getTime() - 3 * DAY,
      });
    }
  }

  // ── Goal health ──
  for (const goal of state.goals) {
    if (goal.archived) continue;
    const health = goalHealth(state, goal, nowMs);
    if (health === "behind") {
      items.push({
        id: `goal-behind-${goal.id}`,
        severity: "urgent",
        title: `Goal behind: ${goal.title}`,
        href: `/goals/${goal.id}`,
        atMs: today.getTime(),
      });
    } else if (health === "at_risk") {
      items.push({
        id: `goal-risk-${goal.id}`,
        severity: "warn",
        title: `Goal at risk: ${goal.title}`,
        href: `/goals/${goal.id}`,
        atMs: today.getTime(),
      });
    }
  }

  // ── Habits not done after 5 PM ──
  if (hour >= 17) {
    const dueHabits = state.habits.filter(
      (h) => !h.archived && isHabitDueOn(h, now)
    );
    const pending = dueHabits.filter(
      (h) =>
        !isCompletedOn(completedDayKeys(state.habitLogs, h.id), now)
    );
    if (pending.length > 0) {
      items.push({
        id: `habits-${toDayKey(today)}`,
        severity: hour >= 21 ? "warn" : "info",
        title: `${pending.length} habit${pending.length > 1 ? "s" : ""} left today`,
        detail: pending.slice(0, 2).map((h) => h.name).join(", "),
        href: "/habits",
        atMs: today.getTime() + 17 * HOUR,
      });
    }
  }

  // ── Daily planning nudge (morning, nothing planned yet) ──
  if (hour < 11) {
    const dayItems = selectCalendarItems(
      state,
      today,
      new Date(today.getTime() + DAY - 1),
      nowMs
    );
    const plannedBlocks = dayItems.filter(
      (i) =>
        i.kind === "event" &&
        Boolean((i.source as { taskId?: string }).taskId)
    ).length;
    if (plannedBlocks === 0) {
      items.push({
        id: `plan-${toDayKey(today)}`,
        severity: "info",
        title: "Plan your day",
        detail: "No time blocks scheduled yet.",
        href: "/planner",
        atMs: today.getTime(),
      });
    }
  }

  // ── Daily review nudge (evening) ──
  if (hour >= 19) {
    const reviewed = state.dailyReviews.some((r) =>
      isSameDay(new Date(r.date), today)
    );
    if (!reviewed) {
      items.push({
        id: `review-${toDayKey(today)}`,
        severity: "info",
        title: "Daily review waiting",
        detail: "Close the loop on today.",
        href: "/review",
        atMs: today.getTime() + 19 * HOUR,
      });
    }
  }

  // ── Weekly report ready (Mondays) ──
  if (now.getDay() === 1 && hour >= 8) {
    items.push({
      id: `report-${toDayKey(today)}`,
      severity: "info",
      title: "Weekly report ready",
      href: "/reports",
      atMs: today.getTime(),
    });
  }

  const severityOrder = { urgent: 0, warn: 1, info: 2 } as const;
  return items.sort(
    (a, b) =>
      severityOrder[a.severity] - severityOrder[b.severity] ||
      a.atMs - b.atMs
  );
}

export function newCount(
  items: AppNotification[],
  lastOpenedAt?: string
): number {
  if (!lastOpenedAt) return items.length;
  const cutoff = new Date(lastOpenedAt).getTime();
  return items.filter((item) => item.atMs > cutoff).length;
}
