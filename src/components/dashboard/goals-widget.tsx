import Link from "next/link";
import { ArrowRight, CalendarClock } from "lucide-react";
import type { Goal } from "@/types";
import { Progress } from "@/components/ui/progress";

function daysUntil(dateStr?: string): number | null {
  if (!dateStr) return null;
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / 86400000));
}

interface GoalsWidgetProps {
  goals: Goal[];
  className?: string;
}

export function GoalsWidget({ goals, className }: GoalsWidgetProps) {
  return (
    <section className={className}>
      <header className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold">Goals</h3>
        <Link href="/goals" className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-xs font-medium">
          All goals <ArrowRight className="size-3" aria-hidden />
        </Link>
      </header>
      <div className="space-y-4">
        {goals.map((goal) => {
          const days = daysUntil(goal.deadline);
          return (
            <div key={goal.id}>
              <div className="mb-1 flex items-baseline justify-between gap-2">
                <span className="truncate text-sm font-medium">{goal.title}</span>
                <span className="text-muted-foreground shrink-0 text-xs tabular-nums">
                  {goal.progressPercent}%
                </span>
              </div>
              <Progress value={goal.progressPercent} aria-label={`${goal.title} progress`} />
              <p className="text-muted-foreground mt-1 flex items-center gap-1 text-xs">
                {days !== null && (
                  <>
                    <CalendarClock className="size-3" aria-hidden />
                    {days}d left
                  </>
                )}
              </p>
            </div>
          );
        })}
        {goals.length === 0 && (
          <p className="text-muted-foreground py-4 text-center text-sm">No active goals.</p>
        )}
      </div>
    </section>
  );
}
