"use client";

import { useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { appStore, type HabitInput } from "@/services/app-store";
import type { Habit } from "@/types";
import { cn } from "@/lib/utils";

const WEEKDAYS = [
  { value: 1, label: "M" },
  { value: 2, label: "T" },
  { value: 3, label: "W" },
  { value: 4, label: "T" },
  { value: 5, label: "F" },
  { value: 6, label: "S" },
  { value: 0, label: "S" },
];

interface HabitFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  habit?: Habit;
}

export function HabitFormDialog({ open, onOpenChange, habit }: HabitFormDialogProps) {
  if (!open) return null;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <HabitFormFields key={habit?.id ?? "__new__"} habit={habit} onClose={() => onOpenChange(false)} />
    </Dialog>
  );
}

function HabitFormFields({ habit, onClose }: { habit?: Habit; onClose: () => void }) {
  const [name, setName] = useState(habit?.name ?? "");
  const [description, setDescription] = useState(habit?.description ?? "");
  const [schedule, setSchedule] = useState<Habit["schedule"]>(habit?.schedule ?? "daily");
  const [weekdays, setWeekdays] = useState<number[]>(habit?.weekdays ?? [1, 3, 5]);

  function submit() {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (schedule === "weekly" && weekdays.length === 0) return;

    const input: HabitInput = {
      name: trimmed,
      description,
      schedule,
      weekdays: schedule === "weekly" ? weekdays : undefined,
    };

    if (habit) {
      appStore.updateHabit(habit.id, input);
      toast("Habit updated");
    } else {
      appStore.addHabit(input);
      toast("Habit created");
    }
    onClose();
  }

  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>{habit ? "Edit habit" : "New habit"}</DialogTitle>
        <DialogDescription>
          Small repeatable actions. Streaks are a signal — consistency is the goal.
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
          <Label htmlFor="habit-name">Name</Label>
          <Input
            id="habit-name"
            autoFocus
            required
            placeholder="e.g. Read 30 minutes"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="habit-description">Why this habit?</Label>
          <Textarea
            id="habit-description"
            rows={2}
            placeholder="Optional reminder of the point"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label>Schedule</Label>
          <Select
            value={schedule}
            onValueChange={(v) => setSchedule(v as Habit["schedule"])}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Every day</SelectItem>
              <SelectItem value="weekly">Specific days</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {schedule === "weekly" && (
          <div className="space-y-2">
            <Label>Days</Label>
            <div className="flex gap-1.5">
              {WEEKDAYS.map((day, idx) => {
                const active = weekdays.includes(day.value);
                return (
                  <button
                    key={`${day.label}-${idx}`}
                    type="button"
                    aria-pressed={active}
                    aria-label={["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][day.value]}
                    onClick={() =>
                      setWeekdays((prev) =>
                        prev.includes(day.value)
                          ? prev.filter((d) => d !== day.value)
                          : [...prev, day.value]
                      )
                    }
                    className={cn(
                      "size-9 rounded-full border text-sm font-medium transition-colors",
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
          </div>
        )}

        <DialogFooter>
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={!name.trim() || (schedule === "weekly" && weekdays.length === 0)}
          >
            {habit ? "Save changes" : "Create habit"}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}
