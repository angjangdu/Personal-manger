"use client";

import { useMemo, useState } from "react";
import {
  Activity as ActivityIcon,
  Pause,
  Play,
  Plus,
  Square,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { ActivityDetailDialog } from "@/components/activities/activity-detail-dialog";
import { StartActivityDialog } from "@/components/activities/start-activity-dialog";
import { ManualActivityDialog } from "@/components/activities/manual-activity-dialog";
import {
  categoryLabel,
} from "@/components/activities/categories";
import { appStore } from "@/services/app-store";
import { useAppState } from "@/hooks/use-app-state";
import { useNow } from "@/hooks/use-now";
import {
  addDays,
  formatElapsed,
  formatMinutes,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from "@/lib/date-utils";
import type { Activity } from "@/types";

type HistoryRange = "today" | "yesterday" | "week" | "month" | "all";

export default function ActivitiesPage() {
  const state = useAppState();
  const nowMs = useNow(1000);

  const [startDialogOpen, setStartDialogOpen] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);
  const [range, setRange] = useState<HistoryRange>("today");
  const [layout, setLayout] = useState<"list" | "timeline">("list");
  const [detail, setDetail] = useState<Activity | null>(null);

  const current = useMemo(
    () => [...state.activities].sort((a, b) => b.startedAt.localeCompare(a.startedAt)).find((a) => !a.endedAt) ?? null,
    [state.activities]
  );

  // ── History filtering ──
  const historyRanges: Record<HistoryRange, [Date, Date]> = useMemo(() => {
    const today = startOfDay();
    return {
      today: [today, addDays(today, 1)],
      yesterday: [addDays(today, -1), today],
      week: [startOfWeek(today), addDays(startOfWeek(today), 7)],
      month: [startOfMonth(today), addDays(startOfMonth(today), 32)],
      all: [new Date(0), addDays(today, 1)],
    };
  }, []);

  const history = state.activities
    .filter((a) => a.endedAt)
    .filter((a) => {
      const started = new Date(a.startedAt).getTime();
      const [from, to] = historyRanges[range];
      if (range === "month") {
        const d = new Date(a.startedAt);
        return (
          d.getMonth() === new Date(nowMs).getMonth() &&
          d.getFullYear() === new Date(nowMs).getFullYear()
        );
      }
      return started >= from.getTime() && started < to.getTime();
    })
    .sort((a, b) => b.startedAt.localeCompare(a.startedAt));

  const rangeTotals = history.reduce((sum, a) => sum + (a.durationMinutes ?? 0), 0);

  function handleStop() {
    if (!current) return;
    const elapsedMin = Math.round((nowMs - new Date(current.startedAt).getTime() - current.totalPausedMs) / 60000);
    appStore.stopActivity(current.id);
    toast("Session saved", { description: `${formatMinutes(elapsedMin)} added to your history.` });
  }

  return (
    <>
      <PageHeader title="Activities" description="Track focused work — durations come from timestamps, not timers.">
        <Button variant="outline" onClick={() => setManualOpen(true)}>
          Add past session
        </Button>
        {!current && (
          <Button onClick={() => setStartDialogOpen(true)}>
            <Plus aria-hidden /> Start activity
          </Button>
        )}
      </PageHeader>

      {/* Active session hero */}
      <ActiveSessionCard
        activity={current}
        nowMs={nowMs}
        onStop={handleStop}
        onStart={() => setStartDialogOpen(true)}
      />

      {/* Day focus summary + planned vs actual */}
      <div className="my-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {(() => {
          const dayStartTs = startOfDay().getTime();
          const todays = state.activities.filter((a) => new Date(a.startedAt).getTime() >= dayStartTs);
          const total = todays.reduce((s, a) => s + (a.durationMinutes ?? (nowMs - new Date(a.startedAt).getTime() - a.totalPausedMs) / 60000), 0);
          const sessions = todays.length;
          const avg = sessions > 0 ? Math.round(total / sessions) : 0;
          // Planned vs actual for tasks tracked today (review §10).
          let plannedSum = 0;
          let actualSum = 0;
          const seenTemplates = new Set<string>();
          for (const a of todays) {
            if (!a.taskId) continue;
            const templateId = a.taskId.split("#")[0];
            if (seenTemplates.has(templateId)) continue;
            seenTemplates.add(templateId);
            actualSum += Math.round(
              (a.durationMinutes ??
                (nowMs - new Date(a.startedAt).getTime() - a.totalPausedMs) / 60000)
            );
            const task = state.tasks.find((t) => t.id === templateId);
            if (task?.estimatedDurationMinutes) plannedSum += task.estimatedDurationMinutes;
          }
          const diff = Math.round(actualSum - plannedSum);
          return (
            <>
              <StatTile label="Focus today" value={formatMinutes(Math.round(total))} />
              <StatTile label="Sessions" value={String(sessions)} />
              <StatTile label="Avg session" value={formatMinutes(avg)} />
              <StatTile
                label="Planned vs actual"
                value={
                  plannedSum > 0 || actualSum > 0
                    ? `${formatMinutes(plannedSum)} / ${formatMinutes(actualSum)}`
                    : "—"
                }
                hint={
                  plannedSum > 0
                    ? `${diff > 0 ? "+" : ""}${formatMinutes(Math.abs(diff))} ${diff > 0 ? "over" : diff < 0 ? "under" : "on target"}`
                    : undefined
                }
              />
            </>
          );
        })()}
      </div>

      {/* History */}
      <section>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-semibold">
            History
            <span className="text-muted-foreground ml-2 font-normal tabular-nums">
              {formatMinutes(rangeTotals)} tracked · {history.length} sessions
            </span>
          </h3>
          <div className="flex flex-wrap items-center gap-2">
            <Tabs value={layout} onValueChange={(v) => setLayout(v as "list" | "timeline")}>
              <TabsList>
                <TabsTrigger value="list">List</TabsTrigger>
                <TabsTrigger value="timeline">Timeline</TabsTrigger>
              </TabsList>
            </Tabs>
            <Tabs value={range} onValueChange={(v) => setRange(v as HistoryRange)}>
              <TabsList className="h-auto flex-wrap">
                <TabsTrigger value="today">Today</TabsTrigger>
                <TabsTrigger value="yesterday">Yesterday</TabsTrigger>
                <TabsTrigger value="week">Week</TabsTrigger>
                <TabsTrigger value="month">Month</TabsTrigger>
                <TabsTrigger value="all">All</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        {history.length === 0 ? (
          <Empty className="rounded-lg border border-dashed py-10">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <ActivityIcon aria-hidden />
              </EmptyMedia>
              <EmptyTitle>No sessions in this range</EmptyTitle>
              <EmptyDescription>Stopped sessions collect here with computed durations.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : layout === "list" ? (
          <ul className="divide-y overflow-hidden rounded-xl border">
            {history.map((activity) => {
              const project = state.projects.find((p) => p.id === activity.projectId);
              return (
                <li key={activity.id}>
                  <button
                    type="button"
                    onClick={() => setDetail(activity)}
                    className="hover:bg-accent/40 flex w-full items-center gap-3 px-4 py-3 text-left transition-colors"
                  >
                    <span className="bg-violet-500/15 text-violet-700 dark:text-violet-300 flex size-8 shrink-0 items-center justify-center rounded-lg">
                      <Zap className="size-4" aria-hidden />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{activity.title}</span>
                      <span className="text-muted-foreground block truncate text-xs tabular-nums">
                        {new Date(activity.startedAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                        {" · "}
                        {new Date(activity.startedAt).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
                        –{activity.endedAt ? new Date(activity.endedAt).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" }) : ""}
                        {project ? ` · ${project.name}` : ""}
                        {activity.category ? ` · ${categoryLabel(activity.category)}` : ""}
                      </span>
                    </span>
                    <span className="shrink-0 text-sm font-semibold tabular-nums">
                      {formatMinutes(activity.durationMinutes ?? 0)}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        ) : (
          <TimelineHistory activities={history} onOpen={setDetail} />
        )}
      </section>

      <StartActivityDialog open={startDialogOpen} onOpenChange={setStartDialogOpen} />
      <ManualActivityDialog open={manualOpen} onOpenChange={setManualOpen} />

      <ActivityDetailDialog
        activity={detail}
        onOpenChange={(open) => {
          if (!open) setDetail(null);
        }}
      />
    </>
  );
}

function StatTile({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <Card className="py-4">
      <CardContent className="px-4">
        <p className="text-muted-foreground text-xs">{label}</p>
        <p className="mt-1 text-xl font-bold tabular-nums">{value}</p>
        {hint && <p className="text-muted-foreground mt-1 text-xs">{hint}</p>}
      </CardContent>
    </Card>
  );
}

/** Day-grouped vertical timeline of sessions. */
function TimelineHistory({
  activities,
  onOpen,
}: {
  activities: Activity[];
  onOpen: (activity: Activity) => void;
}) {
  const groups = new Map<string, Activity[]>();
  for (const activity of activities) {
    const key = startOfDay(new Date(activity.startedAt)).toDateString();
    groups.set(key, [...(groups.get(key) ?? []), activity]);
  }

  return (
    <div className="space-y-4">
      {[...groups.entries()].map(([key, dayActivities]) => (
        <section key={key}>
          <h4 className="text-muted-foreground mb-1.5 text-xs font-semibold uppercase tracking-wide">
            {new Date(key).toLocaleDateString(undefined, {
              weekday: "long",
              month: "short",
              day: "numeric",
            })}
            <span className="ml-2 font-normal tabular-nums">
              {formatMinutes(
                dayActivities.reduce((s, a) => s + (a.durationMinutes ?? 0), 0)
              )}
            </span>
          </h4>
          <ol className="relative space-y-0 border-l pl-4">
            {dayActivities.map((activity) => (
              <li key={activity.id} className="relative pb-3">
                <span
                  className="bg-background absolute -left-[5px] top-1.5 size-2.5 rounded-full border-2 border-violet-500"
                  aria-hidden
                />
                <button
                  type="button"
                  onClick={() => onOpen(activity)}
                  className="hover:bg-accent/40 -mx-2 w-[calc(100%+1rem)] rounded-lg px-2 py-1.5 text-left transition-colors"
                >
                  <span className="block truncate text-sm font-medium">
                    {activity.title}
                    {activity.category && (
                      <span className="text-muted-foreground ml-2 text-[11px] font-normal">
                        {categoryLabel(activity.category)}
                      </span>
                    )}
                  </span>
                  <span className="text-muted-foreground block text-xs tabular-nums">
                    {new Date(activity.startedAt).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
                    –{activity.endedAt ? new Date(activity.endedAt).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" }) : ""}
                    {" · "}
                    {formatMinutes(activity.durationMinutes ?? 0)}
                  </span>
                </button>
              </li>
            ))}
          </ol>
        </section>
      ))}
      <p className="text-muted-foreground text-xs">
        Activities also appear as violet blocks on the Calendar, and focus trends
        live in Analytics.
      </p>
    </div>
  );
}

function ActiveSessionCard({
  activity,
  nowMs,
  onStop,
  onStart,
}: {
  activity: Activity | null;
  nowMs: number;
  onStop: () => void;
  onStart: () => void;
}) {
  if (!activity) {
    return (
      <Empty className="rounded-lg border border-dashed">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Zap aria-hidden />
          </EmptyMedia>
          <EmptyTitle>No active session</EmptyTitle>
          <EmptyDescription>
            Start one from a task or free-form — pauses are subtracted automatically.
          </EmptyDescription>
        </EmptyHeader>
        <Button onClick={onStart}>
          <Play aria-hidden /> Start activity
        </Button>
      </Empty>
    );
  }

  const paused = Boolean(activity.pausedAt);
  const anchor = paused ? new Date(activity.pausedAt!).getTime() : nowMs;
  const elapsed = Math.max(0, anchor - new Date(activity.startedAt).getTime() - activity.totalPausedMs);

  return (
    <Card className="border-violet-500/40 my-4 border-2">
      <CardContent className="flex flex-wrap items-center gap-x-6 gap-y-4 px-6 py-5">
        <div className="min-w-0 flex-1">
          <p className="text-muted-foreground flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide">
            <span className={cnDot(paused)} aria-hidden />
            {paused ? "Paused" : "Tracking"}
          </p>
          <p className="truncate text-lg font-semibold">{activity.title}</p>
        </div>
        <p
          className="order-first w-full text-center text-5xl font-bold tabular-nums tracking-tight sm:order-none sm:w-auto"
          role="timer"
          aria-label="Elapsed time"
        >
          {formatElapsed(elapsed)}
        </p>
        <div className="flex gap-2">
          {paused ? (
            <Button variant="secondary" onClick={() => appStore.resumeActivity(activity.id)}>
              <Play aria-hidden /> Resume
            </Button>
          ) : (
            <Button variant="secondary" onClick={() => appStore.pauseActivity(activity.id)}>
              <Pause aria-hidden /> Pause
            </Button>
          )}
          <Button variant="destructive" onClick={onStop}>
            <Square aria-hidden /> Stop & save
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function cnDot(paused: boolean): string {
  return paused
    ? "inline-block size-2 rounded-full bg-yellow-500"
    : "animate-pulse inline-block size-2 rounded-full bg-red-500";
}
