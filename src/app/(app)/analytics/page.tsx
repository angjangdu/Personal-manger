"use client";

import { useState } from "react";
import Link from "next/link";
import {
  AlarmClock,
  CheckCheck,
  Flame,
  Target,
  Timer,
  TrendingUp,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { BarChart, BarLabels } from "@/components/charts/bar-chart";
import { DonutChart } from "@/components/charts/donut-chart";
import { useAppState } from "@/hooks/use-app-state";
import { useNow } from "@/hooks/use-now";
import {
  focusDistributionByProject,
  focusMinutesPerDay,
  goalProgressRows,
  habitConsistencyRows,
  tasksCompletedPerDay,
} from "@/lib/analytics-utils";
import { formatMinutes } from "@/lib/date-utils";
import type { DistributionSlice } from "@/lib/analytics-utils";

type RangeKey = "7" | "14" | "30";

const DONUT_COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ec4899", "#06b6d4"];

export default function AnalyticsPage() {
  const state = useAppState();
  const nowMs = useNow(60000);
  const [focusRange, setFocusRange] = useState<RangeKey>("14");

  const completionBars = tasksCompletedPerDay(state, 7, nowMs);
  const focusBars =
    focusRange === "7"
      ? focusMinutesPerDay(state, 7, nowMs)
      : focusRange === "14"
        ? focusMinutesPerDay(state, 14, nowMs)
        : focusMinutesPerDay(state, 30, nowMs);

  // React Compiler auto-memoizes these.
  const distribution: DistributionSlice[] = focusDistributionByProject(
    state,
    30,
    nowMs
  ).map((slice, i) => ({
    ...slice,
    color: slice.color.startsWith("#") || slice.color.startsWith("var")
      ? slice.color
      : DONUT_COLORS[i % DONUT_COLORS.length],
  }));
  const goals = goalProgressRows(state);
  const habits = habitConsistencyRows(state, nowMs);

  const completed30 = state.tasks.filter(
    (t) =>
      t.completedAt &&
      new Date(t.completedAt).getTime() > nowMs - 30 * 86400000
  ).length;
  const activeCount = state.tasks.filter(
    (t) => t.status !== "completed" && t.status !== "cancelled"
  ).length;
  const overdueCount = state.tasks.filter(
    (t) =>
      t.dueDate &&
      new Date(t.dueDate).getTime() < nowMs &&
      t.status !== "completed" &&
      t.status !== "cancelled"
  ).length;
  const totalFocus30 = focusBars.reduce((s, b) => s + b.value, 0);

  return (
    <>
      <PageHeader
        title="Analytics"
        description="Signals, not noise — the few numbers worth watching."
      />

      {/* Tiles */}
      <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          icon={<CheckCheck className="size-4" aria-hidden />}
          label="Completed (30d)"
          value={String(completed30)}
        />
        <StatTile
          icon={<AlarmClock className="size-4" aria-hidden />}
          label="Overdue now"
          value={String(overdueCount)}
          tone={overdueCount > 0 ? "warn" : undefined}
          hint={`${activeCount} active`}
        />
        <StatTile
          icon={<Timer className="size-4" aria-hidden />}
          label="Focus (30d)"
          value={formatMinutes(totalFocus30)}
        />
        <StatTile
          icon={<TrendingUp className="size-4" aria-hidden />}
          label="Avg daily focus (range)"
          value={formatMinutes(Math.round(totalFocus30 / Math.max(1, focusBars.length)))}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Weekly task completion */}
        <Card>
          <CardHeader>
            <CardDescription>Tasks completed — last 7 days</CardDescription>
            <CardTitle className="text-base tabular-nums">
              {completionBars.reduce((s, b) => s + b.value, 0)} total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <BarChart bars={completionBars} heightPx={110} />
            <BarLabels labels={completionBars.map((b) => b.label)} every={1} />
          </CardContent>
        </Card>

        {/* Focus trend */}
        <Card>
          <CardHeader className="flex-row items-start justify-between space-y-0">
            <div>
              <CardDescription>Focus minutes per day</CardDescription>
              <CardTitle className="text-base tabular-nums">
                {formatMinutes(focusBars.reduce((s, b) => s + b.value, 0))} in range
              </CardTitle>
            </div>
            <Tabs value={focusRange} onValueChange={(v) => setFocusRange(v as RangeKey)}>
              <TabsList>
                <TabsTrigger value="7">7d</TabsTrigger>
                <TabsTrigger value="14">14d</TabsTrigger>
                <TabsTrigger value="30">30d</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
          <CardContent>
            <BarChart bars={focusBars} heightPx={110} formatValue={(v) => formatMinutes(v)} />
            <BarLabels labels={focusBars.map((b) => b.label)} every={focusRange === "30" ? 5 : 2} />
          </CardContent>
        </Card>

        {/* Time distribution */}
        <Card>
          <CardHeader>
            <CardDescription>Time distribution by project</CardDescription>
            <CardTitle className="text-base">Last 30 days</CardTitle>
          </CardHeader>
          <CardContent>
            <DonutChart
              slices={distribution}
              centerLabel={formatMinutes(distribution.reduce((s, x) => s + x.value, 0))}
              centerSublabel="tracked"
            />
          </CardContent>
        </Card>

        {/* Goal progress */}
        <Card>
          <CardHeader>
            <CardDescription>Goal progress</CardDescription>
            <CardTitle className="text-base">Derived from real work</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {goals.length === 0 ? (
              <p className="text-muted-foreground py-4 text-center text-sm">
                No active goals.{" "}
                <Link href="/goals" className="text-primary underline underline-offset-4">
                  Create one
                </Link>{" "}
                to see progress here.
              </p>
            ) : (
              goals.slice(0, 5).map((goal) => (
                <div key={goal.id}>
                  <div className="mb-1 flex items-baseline justify-between gap-2">
                    <Link href={`/goals/${goal.id}`} className="min-w-0 truncate text-sm font-medium hover:underline">
                      {goal.title}
                    </Link>
                    <span className="text-muted-foreground shrink-0 text-xs tabular-nums">
                      {goal.percent}%
                    </span>
                  </div>
                  <Progress value={goal.percent} aria-label={`${goal.title} progress`} />
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Habit consistency */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardDescription>Habit consistency</CardDescription>
            <CardTitle className="flex items-center gap-2 text-base">
              <Flame className="size-4 text-orange-500" aria-hidden /> 30-day window · streaks are a signal, consistency is the goal
            </CardTitle>
          </CardHeader>
          <CardContent>
            {habits.length === 0 ? (
              <Empty className="border-dashed py-6">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <Target aria-hidden />
                  </EmptyMedia>
                  <EmptyTitle>No habits yet</EmptyTitle>
                  <EmptyDescription>
                    Add habits to see consistency trends here.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            ) : (
              <div className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
                {habits.map((habit) => (
                  <div key={habit.id}>
                    <div className="mb-1 flex items-baseline justify-between gap-2">
                      <span className="min-w-0 truncate text-sm font-medium">{habit.name}</span>
                      <span className="text-muted-foreground shrink-0 text-xs tabular-nums">
                        {habit.percent}%
                      </span>
                    </div>
                    <Progress
                      value={habit.percent}
                      aria-label={`${habit.name} consistency`}
                      className={
                        habit.percent >= 80
                          ? "[&>div]:bg-emerald-500"
                          : habit.percent >= 50
                            ? "[&>div]:bg-yellow-500"
                            : "[&>div]:bg-red-500"
                      }
                    />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function StatTile({
  icon,
  label,
  value,
  hint,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint?: string;
  tone?: "warn";
}) {
  return (
    <Card className="py-4">
      <CardContent className="px-4">
        <p className="text-muted-foreground flex items-center gap-1.5 text-xs">
          {icon}
          {label}
        </p>
        <p
          className={`mt-1 text-2xl font-bold tabular-nums ${
            tone === "warn" && value !== "0" ? "text-orange-600 dark:text-orange-400" : ""
          }`}
        >
          {value}
        </p>
        {hint && <p className="text-muted-foreground mt-1 text-xs">{hint}</p>}
      </CardContent>
    </Card>
  );
}
