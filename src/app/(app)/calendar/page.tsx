"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MonthView } from "@/components/calendar/month-view";
import { TimeGrid } from "@/components/calendar/time-grid";
import { AgendaView } from "@/components/calendar/agenda-view";
import {
  EventDialog,
  type EventDialogPrefill,
} from "@/components/calendar/event-dialog";
import {
  ReasonDialog,
  type MoveReason,
} from "@/components/calendar/reason-dialog";
import { TaskFormDialog } from "@/components/tasks/task-form-dialog";
import { appStore } from "@/services/app-store";
import { useAppState } from "@/hooks/use-app-state";
import { useNow } from "@/hooks/use-now";
import { useIsMobile } from "@/hooks/use-mobile";
import { selectCalendarItems, selectAllDayTasksForDay } from "@/lib/calendar-selectors";
import {
  addDays,
  monthGridCells,
  startOfDay,
  startOfWeek,
} from "@/lib/date-utils";
import type { CalendarItem } from "@/lib/calendar-selectors";
import type { CalendarEvent, RescheduleLog, Task } from "@/types";

type ViewKey = "day" | "3days" | "week" | "month" | "agenda";

interface PendingMove {
  eventId: string;
  title: string;
  fromStartIso: string;
  toStartIso: string;
}

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
  const [pendingMove, setPendingMove] = useState<PendingMove | null>(null);

  // On mobile the week collapses to a single day (UI/UX doc §5).
  const effectiveDays =
    isMobile && view === "week"
      ? [startOfDay(cursor)]
      : view === "day"
        ? [startOfDay(cursor)]
        : view === "3days"
          ? Array.from({ length: 3 }, (_, i) => addDays(startOfDay(cursor), i))
          : view === "week"
            ? Array.from({ length: 7 }, (_, i) => addDays(startOfWeek(cursor), i))
            : [];

  const rangeStart =
    view === "agenda"
      ? startOfDay(cursor)
      : (effectiveDays[0] ?? startOfDay(cursor));
  const rangeEnd = (() => {
    if (view === "agenda") return addDays(startOfDay(cursor), 13);
    const last = effectiveDays[effectiveDays.length - 1];
    return new Date(last.getFullYear(), last.getMonth(), last.getDate(), 23, 59, 59, 999);
  })();
  const minuteTick = Math.floor(nowMs / 60000);

  // React Compiler auto-memoizes this from its inputs.
  const items = selectCalendarItems(state, rangeStart, rangeEnd, minuteTick * 60000);

  function navigate(direction: -1 | 1) {
    switch (view) {
      case "month":
        setCursor((c) => {
          const d = new Date(c);
          d.setMonth(d.getMonth() + direction);
          return d;
        });
        break;
      case "week":
      case "agenda":
        setCursor((c) => addDays(c, 7 * direction));
        break;
      case "3days":
        setCursor((c) => addDays(c, 3 * direction));
        break;
      default:
        setCursor((c) => addDays(c, direction));
    }
  }

  function openCreate(prefillData?: EventDialogPrefill) {
    setEditingEvent(undefined);
    setEditingTask(undefined);
    setPrefill(prefillData);
    setDialogOpen(true);
  }

  function handleItemClick(item: CalendarItem) {
    if (item.kind === "event") {
      // Editing a generated occurrence edits its series template.
      const source = item.source as CalendarEvent;
      setEditingEvent(source);
      setEditingTask(undefined);
      setPrefill(undefined);
      setDialogOpen(true);
    } else if (item.kind === "task") {
      setEditingTask(item.source as Task);
      setDialogOpen(true);
    } else {
      toast("Activity details live on the Activities page");
    }
  }

  function handleDropMove(
    itemId: string,
    durationMin: number,
    date: Date,
    minutes: number
  ) {
    const item = items.find((i) => i.id === itemId && i.kind === "event");
    if (!item) {
      toast("Only events can be dragged", {
        description: "Tasks are moved via the Daily Planner.",
      });
      return;
    }
    // Recurring occurrences can't be moved individually yet — their series
    // times are edited via the dialog instead.
    if (itemId.includes("#")) {
      toast("Recurring item", {
        description: "Change the series time via its edit dialog.",
      });
      return;
    }
    const start = new Date(date);
    start.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0);
    setPendingMove({
      eventId: itemId,
      title: item.title,
      fromStartIso: new Date(item.startMs).toISOString(),
      toStartIso: start.toISOString(),
      // durationMin rides along via closure of target end computation
      ...({ durationMin } as object),
    } as PendingMove & { durationMin: number });
  }

  function confirmMove(move: MoveReason) {
    if (!pendingMove) return;
    const extra = pendingMove as PendingMove & { durationMin?: number };
    const end = new Date(
      new Date(pendingMove.toStartIso).getTime() +
        (extra.durationMin ?? 30) * 60000
    ).toISOString();
    appStore.updateEvent(pendingMove.eventId, {
      startAt: pendingMove.toStartIso,
      endAt: end,
    });
    appStore.addRescheduleLog({
      itemId: pendingMove.eventId.split("#")[0],
      itemType: "event",
      title: pendingMove.title,
      fromStart: pendingMove.fromStartIso,
      toStart: pendingMove.toStartIso,
      reason: move.reason as RescheduleLog["reason"],
      note: move.note,
    });
    toast("Moved", { description: "Reason saved for your reschedule report." });
    setPendingMove(null);
  }

  const periodLabel = (() => {
    switch (view) {
      case "month":
        return cursor.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
      case "agenda":
        return `${rangeStart.toLocaleDateString("en-GB", { month: "short", day: "numeric" })} – ${addDays(rangeStart, 13).toLocaleDateString("en-GB", { month: "short", day: "numeric" })}`;
      case "week":
        return `${rangeStart.toLocaleDateString("en-GB", { month: "short", day: "numeric" })} – ${rangeEnd.getDate()}, ${rangeEnd.getFullYear()}`;
      default:
        return cursor.toLocaleDateString("en-GB", {
          weekday: "long",
          month: "long",
          day: "numeric",
        });
    }
  })();

  return (
    <>
      <PageHeader
        title="Calendar"
        description="Classes, tasks, and tracked time — drag blocks to reschedule."
      >
        <Button variant="outline" onClick={() => openCreate({ date: startOfDay(cursor) })}>
          <Plus aria-hidden /> Event
        </Button>
      </PageHeader>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon-sm" onClick={() => navigate(-1)} aria-label="Previous">
            <ChevronLeft aria-hidden />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setCursor(new Date())}>
            Today
          </Button>
          <Button variant="outline" size="icon-sm" onClick={() => navigate(1)} aria-label="Next">
            <ChevronRight aria-hidden />
          </Button>
        </div>
        <h3 className="text-sm font-semibold">{periodLabel}</h3>
        <Tabs value={view} onValueChange={(v) => setView(v as ViewKey)} className="ml-auto">
          <TabsList className="h-auto flex-wrap">
            <TabsTrigger value="day">Day</TabsTrigger>
            {!isMobile && <TabsTrigger value="3days">3-Day</TabsTrigger>}
            <TabsTrigger value="week">{isMobile ? "Day+" : "Week"}</TabsTrigger>
            <TabsTrigger value="month">Month</TabsTrigger>
            <TabsTrigger value="agenda">Agenda</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {view === "month" ? (
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
      ) : view === "agenda" ? (
        <AgendaView
          items={items}
          rangeStart={rangeStart}
          days={14}
          onItemClick={handleItemClick}
        />
      ) : (
        <TimeGrid
          days={effectiveDays}
          items={items}
          nowMs={nowMs}
          onItemClick={handleItemClick}
          onSlotClick={handleSlotClick}
          onDropMove={handleDropMove}
        />
      )}

      {/* Untimed deadline hint under month view */}
      {view === "month" &&
        selectAllDayTasksForDay(state, startOfDay(cursor)).length > 0 && (
          <p className="text-muted-foreground mt-3 text-xs">
            Untimed deadlines for this day appear as all-day blocks in Day/Week/Agenda.
          </p>
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

      <TaskFormDialog
        open={Boolean(editingTask)}
        onOpenChange={(open) => {
          if (!open) setEditingTask(undefined);
        }}
        task={editingTask}
      />

      <ReasonDialog
        open={Boolean(pendingMove)}
        onOpenChange={(open) => !open && setPendingMove(null)}
        title={pendingMove?.title ?? ""}
        onConfirm={confirmMove}
      />
    </>
  );

  function handleSlotClick(date: Date, minutes: number) {
    const hour = Math.floor(minutes / 60);
    openCreate({
      date,
      startTime: `${String(hour).padStart(2, "0")}:00`,
      endTime: `${String(Math.min(23, hour + 1)).padStart(2, "0")}:00`,
    });
  }
}
