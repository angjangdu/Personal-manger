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
import { appStore } from "@/services/app-store";
import type { Activity } from "@/types";
import Link from "next/link";

interface CurrentActivityCardProps {
  activity: Activity | null;
  className?: string;
}

export function CurrentActivityCard({
  activity,
  className,
}: CurrentActivityCardProps) {
  const now = useNow(1000);

  if (!activity) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardDescription>Current activity</CardDescription>
          <CardTitle className="text-base">No active activity</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            Start one from{" "}
            <Link href="/activities" className="text-primary underline underline-offset-4">
              Activities
            </Link>{" "}
            to track focused work in real time.
          </p>
        </CardContent>
      </Card>
    );
  }

  const paused = Boolean(activity.pausedAt);
  const anchor = paused ? new Date(activity.pausedAt!).getTime() : now;
  const elapsed = Math.max(
    0,
    anchor - new Date(activity.startedAt).getTime() - activity.totalPausedMs
  );

  function togglePause() {
    if (paused) {
      appStore.resumeActivity(activity!.id);
      toast("Resumed");
    } else {
      appStore.pauseActivity(activity!.id);
      toast("Paused", { description: "Elapsed time is frozen while paused." });
    }
  }

  function stop() {
    if (!activity) return;
    const minutes = Math.round(elapsed / 60000);
    appStore.stopActivity(activity.id);
    toast("Session saved", {
      description: `${minutes} min added to your history.`,
    });
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardDescription>Current activity</CardDescription>
        <CardTitle className="truncate text-base">{activity.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p
          className="text-4xl font-bold tabular-nums tracking-tight"
          role="timer"
          aria-label="Elapsed time"
          suppressHydrationWarning
        >
          {formatElapsed(elapsed)}
        </p>
        <div className="mt-4 flex gap-2">
          <Button size="sm" variant="secondary" onClick={togglePause}>
            {paused ? <Play aria-hidden /> : <Pause aria-hidden />}
            {paused ? "Resume" : "Pause"}
          </Button>
          <Button size="sm" variant="destructive" onClick={stop}>
            <Square aria-hidden /> Stop
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
