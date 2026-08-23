"use client";

import { useState } from "react";
import { CalendarPlus, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MonthView } from "@/components/calendar/month-view";
import { TimeGrid } from "@/components/calendar/time-grid";
import {
  EventDialog,
  type EventDialogPrefill,
} from "@/components/calendar/event-dialog";
import { TaskFormDialog } from "@/components/tasks/task-form-dialog";
import { useAppState } from "@/hooks/use-app-state";
import { useNow } from "@/hooks/use-now";
import { useIsMobile } from "@/hooks/use-mobile";
import { selectCalendarItems, selectAllDayTasksForDay } from "@/lib/calendar-selectors";
import {
  addDays,
  addMonths,
  monthGridCells,
  startOfDay,
  startOfWeek,
} from "@/lib/date-utils";
import type { CalendarItem } from "@/lib/calendar-selectors";
import type { CalendarEvent, Task } from "@/types";

type ViewKey = "day" | "week" | "month";

export default function CalendarPage() {
  const state = useAppState();
  const nowMs = useNow(60000);
  const isMobile = useIsMobile();

  const [view, setView] = useState<ViewKey>("week");
  const [cursor, setCursor] = useState(() => new Date());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | undefined>(undefined);
  const [editingTask, setEditingTask] = useState<Task | undefined>(undefined);
  const [prefill, setPrefill] = useState<EventDialogPrefill | undefined>(undefined);

  // On mobile the week collapses to a single day (UI/UX doc §5: vertical timeline).
  const effectiveDays =
    isMobile && view === "week"
      ? [startOfDay(cursor)]
      : view === "day"
        ? [startOfDay(cursor)]
        : Array.from({ length: 7 }, (_, i) => addDays(startOfWeek(cursor), i));

  const rangeStart = effectiveDays[0];
  const rangeEnd = (() => {
    const last = effectiveDays[effectiveDays.length - 1];
    return new Date(last.getFullYear(), last.getMonth(), last.getDate(), 23, 59, 59, 999);
  })();
  // Minute granularity keeps downstream renders stable between ticks.
  const minuteTick = Math.floor(nowMs / 60000);

  // React Compiler auto-memoizes this from its inputs.
  const items = selectCalendarItems(state, rangeStart, rangeEnd, minuteTick * 60000);

  function navigate(direction: -1 | 1) {
    if (view === "month") setCursor((c) => addMonths(c, direction));
    else if (view === "week" && !isMobile) setCursor((c) => addDays(c, 7 * direction));
    else setCursor((c) => addDays(c, direction));
  }

  function goToday() {
    setCursor(new Date());
  }

  function openCreate(prefillData?: EventDialogPrefill) {
    setEditingEvent(undefined);
    setEditingTask(undefined);
    setPrefill(prefillData);
    setDialogOpen(true);
  }

  function handleItemClick(item: CalendarItem) {
    if (item.kind === "event") {
      setEditingEvent(item.source as CalendarEvent);
      setEditingTask(undefined);
      setPrefill(undefined);
      setDialogOpen(true);
    } else if (item.kind === "task") {
      setEditingTask(item.source as Task);
      setEditingEvent(undefined);
      setDialogOpen(true);
    } else {
      toast("Activity details arrive in Phase 10", {
        description: "Timer controls and session history land with activity tracking.",
      });
    }
  }

  function handleSlotClick(date: Date, minutes: number) {
    const hour = Math.floor(minutes / 60);
    openCreate({
      date,
      startTime: `${String(hour).padStart(2, "0")}:00`,
      endTime: `${String(Math.min(23, hour + 1)).padStart(2, "0")}:00`,
    });
  }

  const periodLabel =
    view === "month"
      ? cursor.toLocaleDateString(undefined, { month: "long", year: "numeric" })
      : view === "week" && !isMobile
        ? `${rangeStart.toLocaleDateString(undefined, { month: "short", day: "numeric" })} – ${rangeEnd.getDate()}, ${rangeEnd.getFullYear()}`
        : cursor.toLocaleDateString(undefined, {
            weekday: "long",
            month: "long",
            day: "numeric",
          });

  return (
    <>
      <PageHeader title="Calendar" description="Events, task deadlines, and tracked time in one place.">
        <Button variant="outline" onClick={() => openCreate({ date: startOfDay(cursor) })}>
          <Plus aria-hidden /> Event
        </Button>
      </PageHeader>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon-sm" onClick={() => navigate(-1)} aria-label="Previous">
            <ChevronLeft aria-hidden />
          </Button>
          <Button variant="outline" size="sm" onClick={goToday}>
            Today
          </Button>
          <Button variant="outline" size="icon-sm" onClick={() => navigate(1)} aria-label="Next">
            <ChevronRight aria-hidden />
          </Button>
        </div>
        <h3 className="text-sm font-semibold">{periodLabel}</h3>
        <Tabs value={view} onValueChange={(v) => setView(v as ViewKey)} className="ml-auto">
          <TabsList>
            <TabsTrigger value="day">Day</TabsTrigger>
            <TabsTrigger value="week">{isMobile ? "Day+" : "Week"}</TabsTrigger>
            <TabsTrigger value="month">Month</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {view === "month" ? (
        <>
          <MonthView
            cells={monthGridCells(cursor)}
            month={cursor.getMonth()}
            items={items}
            nowMs={nowMs}
            onDayClick={(date) => {
              setCursor(date);
              openCreate({ date });
            }}
            onItemClick={handleItemClick}
          />
          {(() => {
            const deadlineTasks = selectAllDayTasksForDay(state, startOfDay(cursor));
            return deadlineTasks.length > 0 ? (
              <section className="mt-4">
                <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold">
                  <CalendarPlus className="size-4" aria-hidden />
                  Untimed deadlines on {cursor.toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                </h3>
                <p className="text-muted-foreground text-xs">
                  Shown in the Day and Week views as all-day blocks.
                </p>
              </section>
            ) : null;
          })()}
        </>
      ) : (
        <TimeGrid
          days={effectiveDays}
          items={items}
          nowMs={nowMs}
          onItemClick={handleItemClick}
          onSlotClick={handleSlotClick}
        />
      )}

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

      {/* Editing tasks from the calendar reuses the task dialog. */}
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
