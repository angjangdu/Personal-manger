"use client";

import Link from "next/link";
import { ArrowRight, CheckCircle2, Circle, Flame } from "lucide-react";
import type { Habit } from "@/types";
import { appStore } from "@/services/app-store";
import { useAppState } from "@/hooks/use-app-state";
import { completedDayKeys, computeStreak } from "@/lib/habit-utils";
import { cn } from "@/lib/utils";

interface HabitsWidgetProps {
  /** Habits due today. */
  habits: Habit[];
  className?: string;
}

export function HabitsWidget({ habits, className }: HabitsWidgetProps) {
  const state = useAppState();
  const now = new Date();
  const doneCount = habits.filter((h) =>
    isDone(h)
  ).length;

  function isDone(habit: Habit): boolean {
    return completedDayKeys(state.habitLogs, habit.id).has(dayKey(now));
  }

  function dayKey(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }

  if (habits.length === 0) {
    return (
      <section className={className}>
        <header className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold">Habits</h3>
          <Link href="/habits" className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-xs font-medium">
            Manage <ArrowRight className="size-3" aria-hidden />
          </Link>
        </header>
        <p className="text-muted-foreground py-4 text-center text-sm">Nothing due today.</p>
      </section>
    );
  }

  return (
    <section className={className}>
      <header className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold">
          Habits
          <span className="text-muted-foreground ml-2 font-normal tabular-nums">
            {doneCount}/{habits.length}
          </span>
        </h3>
        <Link href="/habits" className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-xs font-medium">
          All habits <ArrowRight className="size-3" aria-hidden />
        </Link>
      </header>
      <ul className="space-y-1.5">
        {habits.map((habit) => {
          const done = isDone(habit);
          const streak = computeStreak(
            habit,
            completedDayKeys(state.habitLogs, habit.id),
            now
          );
          return (
            <li key={habit.id}>
              <button
                type="button"
                role="checkbox"
                aria-checked={done}
                onClick={() => appStore.toggleHabitLog(habit.id, now)}
                className="hover:bg-accent flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left transition-colors"
              >
                {done ? (
                  <CheckCircle2 className="size-4 shrink-0 fill-current text-emerald-500" aria-hidden />
                ) : (
                  <Circle className="text-muted-foreground size-4 shrink-0" aria-hidden />
                )}
                <span className={cn("min-w-0 flex-1 truncate text-sm", done && "text-muted-foreground line-through")}>
                  {habit.name}
                </span>
                {streak > 0 && (
                  <>
                    <Flame className="size-3 shrink-0 text-orange-500" aria-hidden />
                    <span className="text-muted-foreground w-4 shrink-0 text-right text-xs tabular-nums">
                      {streak}
                    </span>
                  </>
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
