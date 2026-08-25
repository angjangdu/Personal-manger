"use client";

import { useMemo, useState } from "react";
import { Check, Sparkles, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { appStore } from "@/services/app-store";
import { useAppState } from "@/hooks/use-app-state";
import { useNow } from "@/hooks/use-now";
import { selectCalendarItems } from "@/lib/calendar-selectors";
import { selectVisibleTasks } from "@/lib/selectors";
import { getDayTimeModel, type FreeGap } from "@/lib/free-time";
import { addDays, formatMinutes, isSameDay, startOfDay } from "@/lib/date-utils";
import type { Task } from "@/types";

const PRIORITY_ORDER = { urgent: 0, high: 1, medium: 2, low: 3 } as const;

interface Suggestion {
  task: Task;
  /** null date = tomorrow fallback used. */
  date: Date;
  gap: FreeGap;
  overdue?: boolean;
}

/**
 * Review doc §5: suggestions, not automatic scheduling.
 * Proposes a free slot per unplanned task — user accepts or dismisses.
 */
export function SuggestionsPanel() {
  const state = useAppState();
  const nowMs = useNow(60000);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const today = startOfDay(new Date(nowMs));
  const minuteTick = Math.floor(nowMs / 60000);

  const todayItems = selectCalendarItems(
    state,
    today,
    new Date(today.getTime() + 86399999),
    minuteTick * 60000
  );
  const tomorrow = addDays(today, 1);
  const tomorrowItems = selectCalendarItems(
    state,
    tomorrow,
    new Date(tomorrow.getTime() + 86399999),
    minuteTick * 60000
  );

  const modelToday = getDayTimeModel(state, today, todayItems, nowMs);
  const modelTomorrow = getDayTimeModel(state, tomorrow, tomorrowItems, nowMs);

  const visibleTasks = selectVisibleTasks(state, nowMs);
  const blockedTemplates = new Set(
    todayItems
      .filter((i) => i.kind === "event")
      .map((i) => ((i.source as { taskId?: string }).taskId ?? "").split("#")[0])
      .filter(Boolean)
  );

  const candidates = useMemo(() => {
    return visibleTasks
      .filter((t) => t.status !== "completed" && t.status !== "cancelled")
      .filter((t) => !blockedTemplates.has(t.virtual?.templateId ?? t.id))
      .filter(
        (t) =>
          (t.dueDate && isSameDay(new Date(t.dueDate), today)) ||
          (t.dueDate &&
            new Date(t.dueDate).getTime() < nowMs &&
            t.status !== "completed") ||
          t.status === "inbox" ||
          t.status === "planned"
      )
      .sort(
        (a, b) =>
          PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority] ||
          (a.dueDate ?? "z").localeCompare(b.dueDate ?? "z")
      );
    // eslint-disable-next-line react-hooks/exhaustive-deps -- blockedTemplates derives from the same inputs
  }, [visibleTasks, today, nowMs]);

  const suggestions: Suggestion[] = [];
  const remainingToday: FreeGap[] = modelToday.freeGaps.filter(
    (gap) => dayStartPlus(today, gap.endMin) > nowMs
  );
  let todayIdx = 0;

  for (const task of candidates.slice(0, 8)) {
    if (suggestions.length >= 3) break;
    if (dismissed.has(keyOf(task))) continue;
    const duration = Math.max(15, task.estimatedDurationMinutes ?? 30);
    const overdue =
      Boolean(task.dueDate) && new Date(task.dueDate!).getTime() < nowMs;

    // Today's remaining gaps first…
    while (todayIdx < remainingToday.length) {
      const gap = remainingToday[todayIdx];
      const available = Math.min(gap.endMin, DAY_END) - Math.max(gap.startMin, minutesOfDay(nowMs, today));
      if (available >= duration) {
        const startMin = Math.max(gap.startMin, minutesOfDay(nowMs, today));
        suggestions.push({ task, date: today, gap: { startMin, endMin: startMin + duration }, overdue });
        gap.startMin = startMin + duration + 5; // small buffer
        break;
      }
      todayIdx++;
    }
    if (suggestions.length > 0 && suggestions[suggestions.length - 1].task.id === task.id) continue;

    // …else tomorrow's earliest fitting gap.
    const tGap = modelTomorrow.freeGaps.find(
      (gap) => gap.endMin - gap.startMin >= duration
    );
    if (tGap) {
      suggestions.push({
        task,
        date: tomorrow,
        gap: { startMin: tGap.startMin, endMin: tGap.startMin + duration },
        overdue,
      });
      tGap.startMin += duration + 5;
    }
  }

  function accept(suggestion: Suggestion) {
    const start = new Date(suggestion.date);
    start.setHours(
      Math.floor(suggestion.gap.startMin / 60),
      suggestion.gap.startMin % 60,
      0,
      0
    );
    const end = new Date(start.getTime() + (suggestion.gap.endMin - suggestion.gap.startMin) * 60000);
    appStore.addEvent({
      title: suggestion.task.title,
      allDay: false,
      startAt: start.toISOString(),
      endAt: end.toISOString(),
      taskId: suggestion.task.virtual?.templateId ?? suggestion.task.id,
    });
    toast("Slot booked", {
      description: `${start.toLocaleTimeString("en-GB", { hour: "2-digit", hour12: false, minute: "2-digit" })} · ${formatMinutes(suggestion.gap.endMin - suggestion.gap.startMin)}`,
    });
    setDismissed((prev) => new Set(prev).add(keyOf(suggestion.task)));
  }

  if (candidates.length === 0 || suggestions.length === 0) return null;

  return (
    <section suppressHydrationWarning className="rounded-xl border border-dashed p-4">
      <h3 className="mb-1 flex items-center gap-2 text-sm font-semibold">
        <Sparkles className="size-4 text-primary" aria-hidden />
        Suggestions
        <span className="text-muted-foreground font-normal">accept or dismiss — nothing books itself</span>
      </h3>
      <ul className="mt-3 space-y-2">
        {suggestions.map(({ task, date, gap, overdue }) => (
          <li
            key={task.id}
            className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg border px-3 py-2"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">
                {task.title}
                {overdue && (
                  <span className="ml-2 rounded bg-red-500/15 px-1.5 py-px text-[10px] font-semibold text-red-600 dark:text-red-400">
                    OVERDUE
                  </span>
                )}
              </p>
              <p className="text-muted-foreground text-xs tabular-nums">
                {duration(task)} · fits{" "}
                <strong className="text-foreground">
                  {fmtTime(date, gap.startMin)}–{fmtTime(date, gap.endMin)}
                </strong>{" "}
                ({date === today ? "today" : "tomorrow"})
              </p>
            </div>
            <div className="flex shrink-0 gap-1.5">
              <Button size="sm" onClick={() => accept({ task, date, gap, overdue })}>
                <Check aria-hidden /> Accept
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() =>
                  setDismissed((prev) => new Set(prev).add(keyOf(task)))
                }
                aria-label={`Dismiss suggestion for ${task.title}`}
              >
                <X aria-hidden />
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

const DAY_END = 24 * 60;

function keyOf(task: Task): string {
  return task.virtual?.templateId ?? task.id;
}

function duration(task: Task): string {
  return formatMinutes(Math.max(15, task.estimatedDurationMinutes ?? 30));
}

function minutesOfDay(nowMs: number, dayStart: Date): number {
  return Math.floor((nowMs - dayStart.getTime()) / 60000);
}

function dayStartPlus(dayStart: Date, minutes: number): number {
  return dayStart.getTime() + minutes * 60000;
}

function fmtTime(date: Date, minutes: number): string {
  const d = new Date(dayStartPlus(date, minutes));
  return d.toLocaleTimeString("en-GB", { hour: "2-digit", hour12: false, minute: "2-digit" });
}
