"use client";

import { Pause, Play, Square } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatElapsed } from "@/lib/date-utils";
import { useNow } from "@/hooks/use-now";
import type { Activity } from "@/types";

interface CurrentActivityCardProps {
  activity: Activity | null;
  className?: string;
}

export function CurrentActivityCard({
  activity,
  className,
}: CurrentActivityCardProps) {
  const now = useNow(1000);

  const elapsed = activity
    ? formatElapsed(now - new Date(activity.startedAt).getTime() - activity.totalPausedMs)
    : null;

  const stub = (action: string) => () =>
    toast(`${action} arrives in Phase 10`, {
      description: "Durations will be computed server-side from timestamps.",
    });

  return (
    <Card className={className}>
      <CardHeader>
        <CardDescription>Current activity</CardDescription>
        <CardTitle className="truncate text-base">
          {activity ? activity.title : "No active activity"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {activity ? (
          <>
            <p
              className="text-4xl font-bold tabular-nums tracking-tight"
              role="timer"
              aria-label="Elapsed time"
            >
              {elapsed}
            </p>
            <div className="mt-4 flex gap-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={stub(activity.pausedAt ? "Resume" : "Pause")}
              >
                {activity.pausedAt ? (
                  <Play aria-hidden />
                ) : (
                  <Pause aria-hidden />
                )}
                {activity.pausedAt ? "Resume" : "Pause"}
              </Button>
              <Button size="sm" variant="destructive" onClick={stub("Stop")}>
                <Square aria-hidden /> Stop
              </Button>
            </div>
          </>
        ) : (
          <p className="text-muted-foreground text-sm">
            Start an activity to track focused work in real time.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
