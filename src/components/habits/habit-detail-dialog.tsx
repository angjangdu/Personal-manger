"use client";

import { useMemo } from "react";
import { Flame, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { appStore } from "@/services/app-store";
import { useAppState } from "@/hooks/use-app-state";
import { useNow } from "@/hooks/use-now";
import {
  bestStreak,
  completedDayKeys,
  computeStreak,
  consistency,
  graceDayKeys,
  isCompletedOn,
  isHabitDueOn,
  toDayKey,
} from "@/lib/habit-utils";
import { addDays, isSameDay, startOfDay } from "@/lib/date-utils";
import { cn } from "@/lib/utils";
import type { Habit } from "@/types";

interface HabitDetailDialogProps {
  habit: Habit | null;
  onOpenChange: (open: boolean) => void;
}

export function HabitDetailDialog({ habit, onOpenChange }: HabitDetailDialogProps) {
  const state = useAppState();
  const now = new Date(useNow(60000));

  const keys = useMemo(
    () => (habit ? completedDayKeys(state.habitLogs, habit.id) : new Set<string>()),
    [state.habitLogs, habit]
  );
  const graceKeys = useMemo(
    () => (habit ? graceDayKeys(state.habitGraceLogs, habit.id) : new Set<string>()),
    [state.habitGraceLogs, habit]
  );

  if (!habit) return null;

  const streak = computeStreak(habit, keys, now, graceKeys);
  const best = bestStreak(habit, keys, now);
  const rate = consistency(habit, keys, now);

  // Grace used in the last 30 days.
  const cutoff = toDayKey(addDays(startOfDay(now), -30));
  const gracedRecently = [...graceKeys].filter((k) => k >= cutoff).length;

  // Last 35 days as a compact grid (5 weeks).
  const days = Array.from({ length: 35 }, (_, i) => addDays(startOfDay(now), -(34 - i)));

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{habit.name}</DialogTitle>
          {habit.description ? (
            <DialogDescription>{habit.description}</DialogDescription>
          ) : (
            <DialogDescription>
              {habit.schedule === "daily" ? "Every day" : "Specific days"} · history and consistency
            </DialogDescription>
          )}
        </DialogHeader>

        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-lg border p-3 text-center">
            <Flame className="mx-auto size-4 text-orange-500" aria-hidden />
            <p className="mt-1 text-xl font-bold tabular-nums">{streak}</p>
            <p className="text-muted-foreground text-[11px]">current streak</p>
          </div>
          <div className="rounded-lg border p-3 text-center">
            <p className="mt-0.5 text-xl font-bold tabular-nums">{best}</p>
            <p className="text-muted-foreground text-[11px]">best (180d)</p>
          </div>
          <div className="rounded-lg border p-3 text-center">
            <p className="mt-0.5 text-xl font-bold tabular-nums">{rate}%</p>
            <p className="text-muted-foreground text-[11px]">30-day consistency</p>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-muted-foreground text-xs">Last 5 weeks</p>
          <div className="grid grid-cols-7 gap-1.5">
            {days.map((day) => {
              const due = isHabitDueOn(habit, day);
              const done = isCompletedOn(keys, day);
              const excused = graceKeys.has(toDayKey(day));
              const today = isSameDay(day, now) || undefined;
              return (
                <button
                  key={day.toISOString()}
                  type="button"
                  disabled={!due}
                  onClick={() => appStore.toggleHabitLog(habit.id, day)}
                  aria-label={`${day.toDateString()}${done ? " — completed" : excused ? " — excused" : due ? " — missed" : " — not scheduled"}`}
                  className={cn(
                    "aspect-square rounded border text-center transition-colors",
                    !due && "border-transparent bg-muted/30",
                    due && !done && !excused && "bg-red-500/10 border-red-500/20 hover:border-primary/50",
                    due && done && "bg-emerald-500/80 border-emerald-600 hover:bg-emerald-500",
                    excused && !done && "bg-yellow-400/70 border-yellow-500",
                    today && "ring-2 ring-primary ring-offset-1 ring-offset-background"
                  )}
                />
              );
            })}
          </div>
          <p className="text-muted-foreground flex items-center justify-between text-[11px]">
            <span className="flex items-center gap-2">
              <span className="inline-block size-2.5 rounded-sm bg-emerald-500" aria-hidden /> done
              <span className="inline-block size-2.5 rounded-sm bg-red-500/40" aria-hidden /> missed
              <span className="inline-block size-2.5 rounded-sm bg-yellow-400" aria-hidden /> excused
              <span className="inline-block size-2.5 rounded-sm bg-muted/50" aria-hidden /> off-day
            </span>
            <span>graced (30d): {gracedRecently}</span>
          </p>
        </div>

        <Button
          variant="outline"
          className="w-full"
          onClick={() =>
            appStore.toggleHabitLog(habit.id, now)
          }
        >
          Toggle today
        </Button>

        <button
          type="button"
          onClick={() => onOpenChange(false)}
          aria-label="Close"
          className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"
        >
          <X className="size-4" />
        </button>
      </DialogContent>
    </Dialog>
  );
}
