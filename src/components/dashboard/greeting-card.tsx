"use client";

import { useRouter } from "next/navigation";
import { CalendarPlus, ListPlus, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatDate, greeting } from "@/lib/date-utils";
import { useNow } from "@/hooks/use-now";

interface GreetingCardProps {
  tasksDone: number;
  tasksTotal: number;
  focusMinutes: number;
  onAddTask?: () => void;
  className?: string;
}

export function GreetingCard({
  tasksDone,
  tasksTotal,
  focusMinutes,
  onAddTask,
  className,
}: GreetingCardProps) {
  const router = useRouter();
  // Slow tick — greeting/date only change at minute granularity.
  const now = new Date(useNow(60000));
  const percent =
    tasksTotal > 0 ? Math.round((tasksDone / tasksTotal) * 100) : 0;

  return (
    <Card className={className}>
      <CardHeader suppressHydrationWarning>
        <CardDescription suppressHydrationWarning>{formatDate(now)}</CardDescription>
        <CardTitle className="text-2xl" suppressHydrationWarning>
          {`${greeting(now)} 👋`}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="mb-1.5 flex items-baseline justify-between">
            <span className="text-muted-foreground text-sm">Today&apos;s progress</span>
            <span className="text-sm font-semibold tabular-nums">{percent}%</span>
          </div>
          <Progress value={percent} aria-label="Today's task progress" />
          <p className="text-muted-foreground mt-2 text-xs">
            {tasksDone}/{tasksTotal} tasks done · {focusMinutes}m focus so far
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={() => (onAddTask ? onAddTask() : router.push("/tasks"))}>
            <ListPlus aria-hidden /> Add Task
          </Button>
          <Button size="sm" variant="secondary" onClick={() => router.push("/activities")}>
            <Play aria-hidden /> Start Activity
          </Button>
          <Button size="sm" variant="ghost" onClick={() => router.push("/planner")}>
            <CalendarPlus aria-hidden /> Plan Day
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
