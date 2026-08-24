"use client";

import Link from "next/link";
import { AlarmClock, CalendarClock, Clock, Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useAppState } from "@/hooks/use-app-state";
import { useNow } from "@/hooks/use-now";
import { selectCalendarItems } from "@/lib/calendar-selectors";
import { selectVisibleTasks } from "@/lib/selectors";
import { getDayTimeModel } from "@/lib/free-time";
import { formatMinutes, isSameDay, startOfDay } from "@/lib/date-utils";

const PRIORITY_ORDER = { urgent: 0, high: 1, medium: 2, low: 3 } as const;

/**
 * Answers the three morning questions from the review doc §3:
 * 1. What do I need to do today?
 * 2. What is my most important task?
 * 3. How much free time do I have?
 */
export function DayBriefCard() {
  const state = useAppState();
  const nowMs = useNow(30000);
  const dayStart = startOfDay(new Date(nowMs));
  const minuteTick = Math.floor(nowMs / 60000);

  const items = selectCalendarItems(
    state,
    dayStart,
    new Date(dayStart.getTime() + 86399999),
    minuteTick * 60000
  );
  const tasksDueToday = selectVisibleTasks(state, nowMs).filter(
    (t) =>
      t.dueDate &&
      isSameDay(new Date(t.dueDate), dayStart) &&
      t.status !== "completed" &&
      t.status !== "cancelled"
  );

  // ⭐ Most Important Task: flagged, then priority order.
  const mit =
    tasksDueToday
      .filter((t) => t.mit)
      .sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority])[0] ??
    null;

  const model = getDayTimeModel(state, dayStart, items, nowMs);

  const nextEvent = items
    .filter((i) => !i.allDay && i.endMs > nowMs)
    .sort((a, b) => a.startMs - b.startMs)[0];

  return (
    <Card className="border-primary/30">
      <CardContent className="grid gap-3 px-4 py-3 text-sm sm:grid-cols-3">
        <div className="flex min-w-0 items-start gap-2">
          <CalendarClock className="text-muted-foreground mt-0.5 size-4 shrink-0" aria-hidden />
          <div className="min-w-0">
            <p className="text-muted-foreground text-[11px] uppercase tracking-wide">
              Today
            </p>
            <p className="font-medium tabular-nums">
              {tasksDueToday.length} task{tasksDueToday.length === 1 ? "" : "s"} due
              {nextEvent && (
                <span className="text-muted-foreground block truncate text-xs font-normal">
                  next: {nextEvent.title} ·{" "}
                  {new Date(nextEvent.startMs).toLocaleTimeString(undefined, {
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="flex min-w-0 items-start gap-2 sm:border-l sm:pl-3">
          <Star
            className={`mt-0.5 size-4 shrink-0 ${mit ? "fill-yellow-400 text-yellow-500" : "text-muted-foreground"}`}
            aria-hidden
          />
          <div className="min-w-0">
            <p className="text-muted-foreground text-[11px] uppercase tracking-wide">
              Most important task
            </p>
            {mit ? (
              <Link href="/tasks" className="block truncate font-medium hover:underline">
                {mit.title}
                <span className="text-muted-foreground block text-xs font-normal capitalize">
                  {mit.priority} · {formatMinutes(mit.estimatedDurationMinutes ?? 30)}
                </span>
              </Link>
            ) : (
              <Link href="/tasks" className="text-muted-foreground hover:text-foreground block truncate text-xs hover:underline">
                None flagged — star one in Tasks
              </Link>
            )}
          </div>
        </div>

        <div className="flex min-w-0 items-start gap-2 sm:border-l sm:pl-3">
          <Clock className="text-muted-foreground mt-0.5 size-4 shrink-0" aria-hidden />
          <div className="min-w-0">
            <p className="text-muted-foreground text-[11px] uppercase tracking-wide">
              Free time left
            </p>
            <p className="font-medium tabular-nums">{formatMinutes(model.freeMinutes)}</p>
            {model.nextFreeGap ? (
              <p className="text-muted-foreground flex items-center gap-1 truncate text-xs font-normal">
                <AlarmClock className="size-3" aria-hidden />
                from{" "}
                {new Date(dayStart.getTime() + model.nextFreeGap.startMin * 60000).toLocaleTimeString(
                  undefined,
                  { hour: "numeric", minute: "2-digit" }
                )}
              </p>
            ) : null}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
