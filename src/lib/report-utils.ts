import type { AppState } from "@/services/app-store";
import type { DailyReview, RescheduleLog } from "@/types";
import { addDays, isSameDay, startOfDay } from "@/lib/date-utils";

export interface ReportData {
  rangeStartMs: number;
  rangeEndMs: number;
  days: number;
  tasksCompleted: number;
  focusMinutes: number;
  studyMinutes: number;
  sessionCount: number;
  byDay: { label: string; completions: number; focus: number }[];
  bestDay: { label: string; date: Date; completions: number } | null;
  completionByHour: number[];
  peakWindow: { from: number; to: number; count: number } | null;
  timeByProject: { label: string; minutes: number; color?: string }[];
  plannedMinutes: number;
  actualMinutes: number;
  reschedules: {
    total: number;
    byReason: Record<string, number>;
    recent: RescheduleLog[];
  };
  reviews: DailyReview[];
}

const REASON_LABELS: Record<string, string> = {
  not_enough_time: "Not enough time",
  higher_priority: "Higher-priority task",
  unexpected_event: "Unexpected event",
  too_tired: "Too tired",
  took_longer: "Task took longer",
  personal: "Personal reason",
  other: "Other",
};

export function reasonLabel(reason: string): string {
  return REASON_LABELS[reason] ?? reason;
}

/** Builds the full report for the trailing `days` window ending today. */
export function buildReport(state: AppState, days: number, nowMs: number): ReportData {
  const end = startOfDay(new Date(nowMs)).getTime() + 86399999;
  const start = addDays(startOfDay(new Date(nowMs)), -(days - 1)).getTime();
  const inRange = (iso?: string) => {
    if (!iso) return false;
    const t = new Date(iso).getTime();
    return t >= start && t <= end;
  };

  const completedTasks = state.tasks.filter(
    (t) => t.status === "completed" && inRange(t.completedAt)
  );
  // Recurring occurrence completions.
  const overrideCompletions: { templateId: string; completedAt: string }[] = [];
  for (const [templateId, overrides] of Object.entries(state.occurrenceOverrides)) {
    for (const override of Object.values(overrides ?? {})) {
      if (override.done && override.completedAt && inRange(override.completedAt)) {
        overrideCompletions.push({ templateId, completedAt: override.completedAt });
      }
    }
  }

  const activities = state.activities.filter((a) => inRange(a.startedAt));
  const focusMinutes = Math.round(
    activities.reduce(
      (sum, a) => sum + (a.durationMinutes ?? 0),
      0
    )
  );
  const studyMinutes =
    state.studySessions.filter((s) => inRange(s.date)).reduce((sum, s) => sum + s.durationMinutes, 0) +
    activities
      .filter((a) => a.studySubjectId)
      .reduce((sum, a) => sum + (a.durationMinutes ?? 0), 0);

  // ── Per-day series ──
  const byDay: ReportData["byDay"] = [];
  let best: ReportData["bestDay"] = null;
  for (let i = 0; i < days; i++) {
    const day = addDays(startOfDay(new Date(nowMs)), -(days - 1 - i));
    const completions =
      completedTasks.filter((t) => isSameDay(new Date(t.completedAt!), day)).length +
      overrideCompletions.filter((o) => isSameDay(new Date(o.completedAt), day)).length;
    const focus = activities
      .filter((a) => isSameDay(new Date(a.startedAt), day))
      .reduce((sum, a) => sum + (a.durationMinutes ?? 0), 0);
    byDay.push({
      label: day.toLocaleDateString("en-GB", { weekday: "short" }),
      completions,
      focus,
    });
    if (!best || completions > best.completions) {
      best = {
        label: day.toLocaleDateString("en-GB", { weekday: "long", month: "short", day: "numeric" }),
        date: day,
        completions,
      };
    }
  }

  // ── Hour-of-day histogram over all completions ──
  const completionByHour = Array.from({ length: 24 }, () => 0);
  for (const t of completedTasks) {
    completionByHour[new Date(t.completedAt!).getHours()]++;
  }
  for (const o of overrideCompletions) {
    completionByHour[new Date(o.completedAt).getHours()]++;
  }
  let peakWindow: ReportData["peakWindow"] = null;
  for (let h = 0; h < 24; h++) {
    const count =
      completionByHour[h % 24] +
      completionByHour[(h + 1) % 24] +
      completionByHour[(h + 2) % 24];
    if (!peakWindow || count > peakWindow.count) {
      peakWindow = { from: h, to: (h + 3) % 24, count };
    }
  }
  if (peakWindow && peakWindow.count === 0) peakWindow = null;

  // ── Time distribution by project ──
  const projectTotals = new Map<string, number>();
  for (const activity of activities) {
    const key = activity.projectId ?? "__none__";
    projectTotals.set(key, (projectTotals.get(key) ?? 0) + (activity.durationMinutes ?? 0));
  }
  const timeByProject = [...projectTotals.entries()]
    .map(([projectId, minutes]) => ({
      label:
        state.projects.find((p) => p.id === projectId)?.name ??
        "Unlinked / other",
      minutes,
      color: state.projects.find((p) => p.id === projectId)?.color,
    }))
    .sort((a, b) => b.minutes - a.minutes);

  // ── Planned vs actual on completed tasks ──
  const seenTemplates = new Set<string>();
  let plannedMinutes = 0;
  let actualMinutes = 0;
  for (const task of completedTasks) {
    if (task.estimatedDurationMinutes) plannedMinutes += task.estimatedDurationMinutes;
  }
  for (const o of overrideCompletions) {
    if (seenTemplates.has(o.templateId)) continue;
    seenTemplates.add(o.templateId);
    const template = state.tasks.find((t) => t.id === o.templateId);
    if (template?.estimatedDurationMinutes) plannedMinutes += template.estimatedDurationMinutes;
  }
  for (const activity of activities) {
    if (!activity.taskId) continue;
    actualMinutes += activity.durationMinutes ?? 0;
  }

  // ── Rescheduling analysis ──
  const periodLogs = state.rescheduleLogs.filter((log) => inRange(log.createdAt));
  const byReason: Record<string, number> = {};
  for (const log of periodLogs) {
    byReason[log.reason] = (byReason[log.reason] ?? 0) + 1;
  }

  const reviews = state.dailyReviews.filter((review) => inRange(review.date));

  return {
    rangeStartMs: start,
    rangeEndMs: end,
    days,
    tasksCompleted: completedTasks.length + overrideCompletions.length,
    focusMinutes,
    studyMinutes,
    sessionCount: activities.length,
    byDay,
    bestDay: best && best.completions > 0 ? best : null,
    completionByHour,
    peakWindow,
    timeByProject,
    plannedMinutes,
    actualMinutes,
    reschedules: {
      total: periodLogs.length,
      byReason,
      recent: periodLogs.slice(0, 5),
    },
    reviews,
  };
}
