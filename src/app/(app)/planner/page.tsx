"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import {
  CalendarClock,
  CalendarDays as CalendarDaysIcon,
  ChevronLeft,
  ChevronRight,
  MousePointerClick,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { TimeGrid } from "@/components/calendar/time-grid";
import {
  EventDialog,
  type EventDialogPrefill,
} from "@/components/calendar/event-dialog";
import { TaskFormDialog } from "@/components/tasks/task-form-dialog";
import { SuggestionsPanel } from "@/components/planner/suggestions-panel";
import { appStore } from "@/services/app-store";
import { useAppState } from "@/hooks/use-app-state";
import { useNow } from "@/hooks/use-now";
import { selectCalendarItems } from "@/lib/calendar-selectors";
import { selectVisibleTasks } from "@/lib/selectors";
import {
  autoPlan,
  findFreeGaps,
  PLANNER_WINDOW,
  totalMinutes,
} from "@/lib/planner-utils";
import { addDays, formatMinutes, isSameDay, startOfDay } from "@/lib/date-utils";
import { cn } from "@/lib/utils";
import type { CalendarItem } from "@/lib/calendar-selectors";
import type { CalendarEvent, Task } from "@/types";

const PRIORITY_ORDER = { urgent: 0, high: 1, medium: 2, low: 3 } as const;

/** A planned block is an event linked to a task. */
function isTaskBlock(item: CalendarItem): boolean {
  return item.kind === "event" && Boolean((item.source as CalendarEvent).taskId);
}

export default function PlannerPage() {
  const state = useAppState();
  const nowMs = useNow(60000);
  const queueRef = useRef<HTMLDivElement>(null);

  const [cursor, setCursor] = useState(() => new Date());
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | undefined>(undefined);
  const [editingTask, setEditingTask] = useState<Task | undefined>(undefined);
  const [prefill, setPrefill] = useState<EventDialogPrefill | undefined>(undefined);

  const dayStart = useMemo(() => startOfDay(cursor), [cursor]);
  const dayEndMs = dayStart.getTime() + 86399999;
  const minuteTick = Math.floor(nowMs / 60000);

  const items = selectCalendarItems(state, dayStart, new Date(dayEndMs), minuteTick * 60000);

  const isTerminal = (t: Task) => t.status === "completed" || t.status === "cancelled";

  // Recurring occurrences participate in planning like any task.
  const visibleTasks = selectVisibleTasks(state, minuteTick * 60000);
  const templateIdOf = (t: Task) => t.virtual?.templateId ?? t.id;

  // Tasks already blocked on this day (events linked to tasks).
  const blockedTaskIds = new Set(
    items
      .filter(isTaskBlock)
      .map((i) => ((i.source as CalendarEvent).taskId ?? "").split("#")[0])
  );

  // Planning queue: today's/undated active tasks not yet blocked.
  const queue = visibleTasks
    .filter((task) => !isTerminal(task))
    .filter(
      (task) =>
        !blockedTaskIds.has(templateIdOf(task)) &&
        ((task.dueDate && isSameDay(new Date(task.dueDate), dayStart)) ||
          task.status === "inbox" ||
          task.status === "planned")
    )
    .sort(
      (a, b) =>
        PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority] ||
        (a.dueDate ?? "z").localeCompare(b.dueDate ?? "z")
    );

  const gaps = findFreeGaps(items);
  const freeMinutes = totalMinutes(gaps);
  const committedMinutes = items
    .filter((i) => !i.allDay && !isTaskBlock(i))
    .reduce((sum, i) => sum + (i.endMs - i.startMs) / 60000, 0);
  const plannedTaskMinutes = items
    .filter(isTaskBlock)
    .reduce((sum, i) => sum + (i.endMs - i.startMs) / 60000, 0);

  const selectedTask = selectedTaskId ? state.tasks.find((t) => t.id === selectedTaskId) : undefined;

  function placeSelected(date: Date, startMin: number) {
    if (!selectedTask) return;
    const duration = Math.max(15, selectedTask.estimatedDurationMinutes ?? 30);
    const start = new Date(date);
    start.setHours(Math.floor(startMin / 60), startMin % 60, 0, 0);
    const end = new Date(start.getTime() + duration * 60000);
    appStore.addEvent({
      title: selectedTask.title,
      allDay: false,
      startAt: start.toISOString(),
      endAt: end.toISOString(),
      taskId: selectedTask.id,
    });
    toast(`Blocked for “${selectedTask.title}”`, {
      description: `${formatMinutes(duration)} · ${String(start.getHours()).padStart(2, "0")}:${String(start.getMinutes()).padStart(2, "0")}`,
    });
    setSelectedTaskId(null);
  }

  function handleSlotClick(date: Date, minutes: number) {
    if (selectedTask) {
      placeSelected(date, minutes);
      return;
    }
    const hour = Math.floor(minutes / 60);
    setEditingEvent(undefined);
    setEditingTask(undefined);
    setPrefill({
      date,
      startTime: `${String(hour).padStart(2, "0")}:00`,
      endTime: `${String(Math.min(23, hour + 1)).padStart(2, "0")}:00`,
    });
    setDialogOpen(true);
  }

  function runAutoPlan() {
    if (queue.length === 0) return;
    const placements = autoPlan(queue, gaps);
    if (placements.length === 0) {
      toast("No free gaps large enough", {
        description: "Clear some committed time or shorten estimates.",
      });
      return;
    }
    for (const p of placements) {
      const task = state.tasks.find((t) => t.id === p.taskId)!;
      const start = new Date(dayStart);
      start.setHours(Math.floor(p.startMin / 60), p.startMin % 60, 0, 0);
      appStore.addEvent({
        title: task.title,
        allDay: false,
        startAt: start.toISOString(),
        endAt: new Date(start.getTime() + (p.endMin - p.startMin) * 60000).toISOString(),
        taskId: task.id,
      });
    }
    toast(`Auto-planned ${placements.length} task${placements.length > 1 ? "s" : ""}`, {
      description: "Blocks respect your existing commitments.",
    });
  }

  function handleItemClick(item: CalendarItem) {
    if (item.kind === "event") {
      setEditingEvent(item.source as CalendarEvent);
      setEditingTask(undefined);
      setPrefill(undefined);
      setDialogOpen(true);
    } else if (item.kind === "task") {
      setEditingTask(item.source as Task);
      setDialogOpen(true);
    } else {
      void item; // activities are read-only anchors until Phase 10
    }
  }

  return (
    <>
      <PageHeader
        title="Daily planner"
        description="Pull tasks into free time — blocks sync to your calendar."
      >
        <Button variant="outline" onClick={runAutoPlan} disabled={queue.length === 0}>
          <Sparkles aria-hidden /> Auto-fill
        </Button>
        <Link href="/calendar">
          <Button variant="ghost">
            <CalendarDaysIcon aria-hidden /> Calendar
          </Button>
        </Link>
      </PageHeader>

      {/* Day navigation */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon-sm" onClick={() => setCursor(addDays(cursor, -1))} aria-label="Previous day">
            <ChevronLeft aria-hidden />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setCursor(new Date())}>
            Today
          </Button>
          <Button variant="outline" size="icon-sm" onClick={() => setCursor(addDays(cursor, 1))} aria-label="Next day">
            <ChevronRight aria-hidden />
          </Button>
        </div>
        <input
          type="date"
          value={dayStart.toLocaleDateString("en-CA")}
          onChange={(e) => {
            const [y, m, d] = e.target.value.split("-").map(Number);
            if (y && m && d) setCursor(new Date(y, m - 1, d));
          }}
          className="border-input bg-background h-8 rounded-md border px-2 text-sm tabular-nums"
          aria-label="Pick a date"
        />
        <h3 className="text-sm font-semibold">{dayStart.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}</h3>
      </div>

      {/* Schedule suggestions (accept/dismiss — nothing auto-books) */}
      <div className="mb-4">
        <SuggestionsPanel />
      </div>

      <div className="grid gap-4 lg:grid-cols-[340px_1fr]">
        {/* Left column: summary + queue */}
        <div className="space-y-4" ref={queueRef}>
          <Card className="py-4">
            <CardContent className="space-y-3 px-4">
              <p className="text-sm font-semibold">Day capacity</p>
              {[
                { label: "Committed (events)", value: committedMinutes, cls: "bg-blue-500" },
                { label: "Planned on tasks", value: plannedTaskMinutes, cls: "bg-emerald-500" },
                { label: "Free", value: freeMinutes, cls: "bg-muted-foreground/40" },
              ].map((row) => {
                const windowTotal = PLANNER_WINDOW.endMin - PLANNER_WINDOW.startMin;
                const pct = Math.round((row.value / windowTotal) * 100);
                return (
                  <div key={row.label}>
                    <div className="mb-1 flex justify-between text-xs">
                      <span className="text-muted-foreground">{row.label}</span>
                      <span className="font-medium tabular-nums">{formatMinutes(Math.round(row.value))}</span>
                    </div>
                    <div className="bg-muted h-1.5 overflow-hidden rounded-full">
                      <div className={cn("h-full rounded-full transition-all", row.cls)} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
              <p className="text-muted-foreground text-[11px]">
                Window {PLANNER_WINDOW.startMin / 60}:00–{PLANNER_WINDOW.endMin / 60}:00 · next free at{" "}
                {gaps[0]
                  ? `${String(Math.floor(gaps[0].startMin / 60)).padStart(2, "0")}:${String(gaps[0].startMin % 60).padStart(2, "0")}`
                  : "—"}
              </p>
            </CardContent>
          </Card>

          <section>
            <h3 className="mb-2 text-sm font-semibold">
              Queue ({queue.length})
              <span className="text-muted-foreground ml-2 font-normal">due today · inbox · planned</span>
            </h3>
            <ul className="divide-y overflow-hidden rounded-xl border">
              {queue.map((task) => (
                <li key={task.id}>
                  <button
                    type="button"
                    onClick={() =>
                      setSelectedTaskId((prev) => (prev === task.id ? null : task.id))
                    }
                    className={cn(
                      "flex w-full items-center gap-2 px-3 py-2 text-left transition-colors",
                      selectedTaskId === task.id ? "bg-primary/10 ring-primary/40 ring-inset" : "hover:bg-accent/50"
                    )}
                  >
                    <span
                      className={cn(
                        "rounded border px-1.5 py-px text-[10px] font-semibold uppercase",
                        task.priority === "urgent" && "border-red-500/50 text-red-600 dark:text-red-400",
                        task.priority === "high" && "border-orange-500/50 text-orange-600 dark:text-orange-400",
                        task.priority === "medium" && "border-yellow-500/50 text-yellow-700 dark:text-yellow-400",
                        task.priority === "low" && "text-muted-foreground"
                      )}
                    >
                      {task.priority}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm">{task.title}</span>
                    <span className="text-muted-foreground shrink-0 text-xs tabular-nums">
                      {formatMinutes(task.estimatedDurationMinutes ?? 30)}
                    </span>
                  </button>
                </li>
              ))}
              {queue.length === 0 && (
                <li className="text-muted-foreground px-3 py-6 text-center text-sm">
                  Everything for this day already has a slot.
                </li>
              )}
            </ul>
          </section>
        </div>

        {/* Right column: timeline */}
        <div>
          {selectedTask ? (
            <div
              className="bg-primary/10 border-primary/30 mb-3 flex items-center gap-2 rounded-lg border px-3 py-2 text-sm"
              role="status"
            >
              <MousePointerClick className="size-4 shrink-0" aria-hidden />
              <span className="min-w-0 flex-1 truncate">
                Click a free slot to block{" "}
                <strong>{selectedTask.title}</strong> ({formatMinutes(selectedTask.estimatedDurationMinutes ?? 30)})
              </span>
              <Button variant="ghost" size="sm" onClick={() => setSelectedTaskId(null)}>
                Cancel
              </Button>
            </div>
          ) : null}

          <TimeGrid
            days={[dayStart]}
            items={items}
            nowMs={minuteTick * 60000}
            onItemClick={handleItemClick}
            onSlotClick={handleSlotClick}
          />

          <p className="text-muted-foreground mt-2 flex items-center gap-1.5 text-xs">
            <CalendarClock className="size-3" aria-hidden />
            Tip: click a task in the queue, then click the timeline to time-block it.
          </p>
        </div>
      </div>

      {/* Nudge/reschedule lives inside the event dialog via edit; quick actions below appear on event click */}
      <EventDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setEditingEvent(undefined);
            setEditingTask(undefined);
          }
          setDialogOpen(open);
        }}
        event={editingEvent}
        prefill={prefill}
      />
      <TaskFormDialog
        open={Boolean(editingTask)}
        onOpenChange={(open) => {
          if (!open) setEditingTask(undefined);
        }}
        task={editingTask}
      />
    </>
  );
}
