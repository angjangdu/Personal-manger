"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { appStore, type EventInput } from "@/services/app-store";
import { useAppState } from "@/hooks/use-app-state";
import { toTimeString } from "@/lib/date-utils";
import type {
  CalendarEvent,
  EventCategory,
  RecurrenceRule,
} from "@/types";
import { cn } from "@/lib/utils";

type RepeatChoice =
  | "none"
  | "daily"
  | "weekdays"
  | "weekly"
  | "biweekly"
  | "monthly"
  | "yearly"
  | "custom";

const REPEAT_OPTIONS: { value: RepeatChoice; label: string }[] = [
  { value: "none", label: "Does not repeat" },
  { value: "daily", label: "Every day" },
  { value: "weekdays", label: "Every weekday (Mon–Fri)" },
  { value: "weekly", label: "Every week" },
  { value: "biweekly", label: "Every 2 weeks" },
  { value: "monthly", label: "Every month" },
  { value: "yearly", label: "Every year" },
  { value: "custom", label: "Custom days…" },
];

const WEEKDAY_CHIPS = [
  { value: 1, label: "M" },
  { value: 2, label: "T" },
  { value: 3, label: "W" },
  { value: 4, label: "T" },
  { value: 5, label: "F" },
  { value: 6, label: "S" },
  { value: 0, label: "S" },
];

function ruleToChoice(rule?: RecurrenceRule): RepeatChoice {
  return (rule?.freq as RepeatChoice) ?? "none";
}

const CATEGORY_OPTIONS: { value: EventCategory; label: string }[] = [
  { value: "general", label: "General" },
  { value: "class", label: "Class / College" },
  { value: "work", label: "Work" },
  { value: "study", label: "Study" },
  { value: "project", label: "Project" },
  { value: "personal", label: "Personal" },
];

export interface EventDialogPrefill {
  date?: Date;
  startTime?: string;
  endTime?: string;
}

interface EventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** When set, the dialog edits this event. */
  event?: CalendarEvent;
  prefill?: EventDialogPrefill;
}

export function EventDialog({ open, onOpenChange, event, prefill }: EventDialogProps) {
  if (!open) return null;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <EventFormFields
        key={event?.id ?? "__new__"}
        event={event}
        prefill={prefill}
        onClose={() => onOpenChange(false)}
      />
    </Dialog>
  );
}

function EventFormFields({
  event,
  prefill,
  onClose,
}: {
  event?: CalendarEvent;
  prefill?: EventDialogPrefill;
  onClose: () => void;
}) {
  const state = useAppState();
  const [title, setTitle] = useState(event?.title ?? "");
  const [allDay, setAllDay] = useState(event?.allDay ?? false);
  const [date, setDate] = useState(
    (event
      ? new Date(event.startAt)
      : prefill?.date ?? new Date()
    ).toLocaleDateString("en-CA")
  );
  const [startTime, setStartTime] = useState(
    event && !event.allDay
      ? toTimeString(new Date(event.startAt))
      : prefill?.startTime ?? "09:00"
  );
  const [endTime, setEndTime] = useState(
    event && !event.allDay
      ? toTimeString(new Date(event.endAt))
      : prefill?.endTime ?? "10:00"
  );
  const [taskId, setTaskId] = useState(event?.taskId ?? "");
  const [repeatChoice, setRepeatChoice] = useState<RepeatChoice>(
    ruleToChoice(event?.repeat)
  );
  const [repeatWeekdays, setRepeatWeekdays] = useState<number[]>(
    event?.repeat?.weekdays ?? []
  );
  const [category, setCategory] = useState<EventCategory>(
    event?.category ?? "general"
  );

  function buildInput(): EventInput | null {
    const trimmed = title.trim();
    if (!trimmed) return null;

    const repeat: RecurrenceRule | undefined =
      repeatChoice === "none"
        ? undefined
        : repeatChoice === "custom"
          ? repeatWeekdays.length > 0
            ? { freq: "custom", weekdays: repeatWeekdays }
            : undefined
          : { freq: repeatChoice };

    const day = new Date(date + "T00:00:00");
    if (allDay) {
      return {
        title: trimmed,
        allDay: true,
        startAt: day.toISOString(),
        endAt: day.toISOString(),
        taskId: taskId === "none" ? "" : taskId,
        repeat,
        category,
      };
    }
    const startMinutes = Number(startTime.slice(0, 2)) * 60 + Number(startTime.slice(3, 5));
    const endMinutes = Number(endTime.slice(0, 2)) * 60 + Number(endTime.slice(3, 5));
    if (endMinutes <= startMinutes) return null;
    const start = new Date(day);
    start.setMinutes(startMinutes);
    const end = new Date(day);
    end.setMinutes(endMinutes);
    return {
      title: trimmed,
      allDay: false,
      startAt: start.toISOString(),
      endAt: end.toISOString(),
      taskId: taskId === "none" ? "" : taskId,
      repeat,
      category,
    };
  }

  const valid = Boolean(buildInput());

  function submit() {
    const input = buildInput();
    if (!input) return;
    if (event) {
      appStore.updateEvent(event.id, input);
      toast("Event updated");
    } else {
      appStore.addEvent(input);
      toast("Event added");
    }
    onClose();
  }

  const activeTasks = state.tasks.filter(
    (t) => t.status !== "completed" && t.status !== "cancelled"
  );

  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>{event ? "Edit event" : "New event"}</DialogTitle>
        <DialogDescription>
          Block time for work, link it to a task, or mark an all-day deadline.
        </DialogDescription>
      </DialogHeader>

      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <div className="space-y-2">
          <Label htmlFor="event-title">Title</Label>
          <Input
            id="event-title"
            autoFocus
            required
            placeholder="e.g. Deep work — Physics"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div className="flex items-center justify-between rounded-lg border p-3">
          <div>
            <p className="text-sm font-medium">All day</p>
            <p className="text-muted-foreground text-xs">Deadlines and day-long items</p>
          </div>
          <Switch checked={allDay} onCheckedChange={setAllDay} aria-label="All day" />
        </div>

        <div className={`grid gap-3 ${allDay ? "" : "grid-cols-[1fr_auto_auto]"}`}>
          <div className="space-y-2">
            <Label htmlFor="event-date">Date</Label>
            <Input
              id="event-date"
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          {!allDay && (
            <>
              <div className="space-y-2">
                <Label htmlFor="event-start">Start</Label>
                <Input
                  id="event-start"
                  type="time"
                  required
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="event-end">End</Label>
                <Input
                  id="event-end"
                  type="time"
                  required
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                />
              </div>
            </>
          )}
        </div>
        {!valid && title.trim() ? (
          <p className="text-destructive text-xs">End time must be after start time.</p>
        ) : null}

        <div className="space-y-2">
          <Label>Linked task (optional)</Label>
          <Select value={taskId || "none"} onValueChange={setTaskId}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="None" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              {activeTasks.map((task) => (
                <SelectItem key={task.id} value={task.id}>
                  {task.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label>Category</Label>
            <Select value={category} onValueChange={(v) => setCategory(v as EventCategory)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORY_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Repeat</Label>
            <Select
              value={repeatChoice}
              onValueChange={(v) => setRepeatChoice(v as RepeatChoice)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {REPEAT_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {(repeatChoice === "custom" || repeatChoice === "weekly") && (
          <div className="flex gap-1.5">
            {WEEKDAY_CHIPS.map((day, idx) => {
              const active = repeatWeekdays.includes(day.value);
              return (
                <button
                  key={`${day.label}-${idx}`}
                  type="button"
                  aria-pressed={active}
                  aria-label={["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][day.value]}
                  onClick={() =>
                    setRepeatWeekdays((prev) =>
                      prev.includes(day.value)
                        ? prev.filter((d) => d !== day.value)
                        : [...prev, day.value]
                    )
                  }
                  className={cn(
                    "size-8 rounded-full border text-xs font-medium transition-colors",
                    active
                      ? "bg-primary text-primary-foreground border-primary"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  )}
                >
                  {day.label}
                </button>
              );
            })}
          </div>
        )}
        {repeatChoice !== "none" && (
          <p className="text-muted-foreground text-[11px]">
            Occurrences repeat automatically on the calendar.
          </p>
        )}

        {event && !allDay ? (
          <div className="flex flex-wrap items-center gap-2 border-t pt-3">
            <span className="text-muted-foreground text-xs">Quick move:</span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                appStore.updateEvent(event.id, {
                  startAt: new Date(new Date(event.startAt).getTime() - 1800000).toISOString(),
                  endAt: new Date(new Date(event.endAt).getTime() - 1800000).toISOString(),
                });
                toast("Moved 30 minutes earlier");
                onClose();
              }}
            >
              −30m
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                appStore.updateEvent(event.id, {
                  startAt: new Date(new Date(event.startAt).getTime() + 1800000).toISOString(),
                  endAt: new Date(new Date(event.endAt).getTime() + 1800000).toISOString(),
                });
                toast("Moved 30 minutes later");
                onClose();
              }}
            >
              +30m
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                appStore.updateEvent(event.id, {
                  startAt: new Date(new Date(event.startAt).getTime() + 86400000).toISOString(),
                  endAt: new Date(new Date(event.endAt).getTime() + 86400000).toISOString(),
                });
                toast("Moved to tomorrow");
                onClose();
              }}
            >
              Tomorrow
            </Button>
          </div>
        ) : null}

        <DialogFooter className={event ? "justify-between sm:justify-between" : ""}>
          {event ? (
            <Button
              type="button"
              variant="ghost"
              className="text-destructive hover:text-destructive"
              onClick={() => {
                appStore.deleteEvent(event.id);
                toast("Event deleted");
                onClose();
              }}
            >
              <Trash2 aria-hidden /> Delete
            </Button>
          ) : (
            <span />
          )}
          <span className="flex gap-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={!title.trim() || !valid}>
              {event ? "Save changes" : "Add event"}
            </Button>
          </span>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}
