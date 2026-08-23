"use client";

import Link from "next/link";
import { ArrowRight, CheckCircle2, Circle } from "lucide-react";
import type { Task } from "@/types";
import { formatMinutes } from "@/lib/date-utils";
import { appStore } from "@/services/app-store";
import { cn } from "@/lib/utils";

interface TodaysTasksCardProps {
  tasks: Task[];
  className?: string;
}

export function TodaysTasksCard({ tasks, className }: TodaysTasksCardProps) {
  const done = tasks.filter((task) => task.status === "completed").length;

  return (
    <section className={cn("rounded-xl border", className)}>
      <header className="flex items-center justify-between border-b px-4 py-3">
        <h3 className="text-sm font-semibold">
          Today&apos;s tasks
          <span className="text-muted-foreground ml-2 font-normal tabular-nums">
            {done}/{tasks.length}
          </span>
        </h3>
        <Link
          href="/tasks"
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-xs font-medium"
        >
          View all <ArrowRight className="size-3" aria-hidden />
        </Link>
      </header>
      <ul className="divide-y">
        {tasks.map((task) => {
          const completed = task.status === "completed";
          return (
            <li key={task.id} className="flex items-center gap-3 px-4 py-2.5">
              <button
                type="button"
                role="checkbox"
                aria-checked={completed}
                aria-label={completed ? `Reopen ${task.title}` : `Complete ${task.title}`}
                onClick={() => appStore.toggleTaskComplete(task.id)}
                className="shrink-0"
              >
                {completed ? (
                  <CheckCircle2 className="size-4 fill-current text-emerald-500" aria-hidden />
                ) : (
                  <Circle
                    className={cn(
                      "text-muted-foreground hover:text-primary hover:border-primary size-4 transition-colors",
                      task.status === "in_progress" && "animate-pulse text-blue-500"
                    )}
                    aria-hidden
                  />
                )}
              </button>
              <span className={cn("flex-1 truncate text-sm", completed && "text-muted-foreground line-through")}>
                {task.title}
              </span>
              <span className="text-muted-foreground hidden text-xs tabular-nums sm:inline">
                {formatMinutes(task.estimatedDurationMinutes ?? 0)}
              </span>
            </li>
          );
        })}
        {tasks.length === 0 && (
          <li className="text-muted-foreground px-4 py-8 text-center text-sm">
            Nothing scheduled for today yet.
          </li>
        )}
      </ul>
    </section>
  );
}
