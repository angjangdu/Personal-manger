"use client";

import { CheckCircle2, Circle } from "lucide-react";
import { toast } from "sonner";
import type { Habit } from "@/types";
import { cn } from "@/lib/utils";

interface HabitsWidgetProps {
  habits: Habit[];
  completedHabitIds: string[];
  className?: string;
}

export function HabitsWidget({ habits, completedHabitIds, className }: HabitsWidgetProps) {
  const doneCount = habits.filter((h) => completedHabitIds.includes(h.id)).length;

  return (
    <section className={className}>
      <header className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold">
          Habits
          <span className="text-muted-foreground ml-2 font-normal tabular-nums">
            {doneCount}/{habits.length}
          </span>
        </h3>
      </header>
      <ul className="space-y-1.5">
        {habits.map((habit) => {
          const done = completedHabitIds.includes(habit.id);
          return (
            <li key={habit.id}>
              <button
                type="button"
                onClick={() =>
                  toast("Habit completion arrives in Phase 13", {
                    description: `“${habit.name}” will become checkable then.`,
                  })
                }
                className="hover:bg-accent flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left transition-colors"
              >
                {done ? (
                  <CheckCircle2 className="size-4 shrink-0 fill-current text-emerald-500" aria-hidden />
                ) : (
                  <Circle className="text-muted-foreground size-4 shrink-0" aria-hidden />
                )}
                <span className={cn("truncate text-sm", done && "text-muted-foreground")}>
                  {habit.name}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
