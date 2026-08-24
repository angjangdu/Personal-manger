"use client";

import { PageHeader } from "@/components/layout/page-header";
import { CurrentActivityCard } from "@/components/dashboard/current-activity-card";
import { GoalsWidget } from "@/components/dashboard/goals-widget";
import { GreetingCard } from "@/components/dashboard/greeting-card";
import { HabitsWidget } from "@/components/dashboard/habits-widget";
import { ProjectsWidget } from "@/components/dashboard/projects-widget";
import { TodaysScheduleCard } from "@/components/dashboard/todays-schedule-card";
import { TodaysTasksCard } from "@/components/dashboard/todays-tasks-card";
import { TaskFormDialog } from "@/components/tasks/task-form-dialog";
import { DayBriefCard } from "@/components/dashboard/day-brief-card";
import { useAppState } from "@/hooks/use-app-state";
import { useNow } from "@/hooks/use-now";
import {
  selectFocusMinutesToday,
  selectProjectTaskCounts,
  selectTodaysTasks,
} from "@/lib/selectors";
import { isHabitDueOn } from "@/lib/habit-utils";
import { useState } from "react";

export default function DashboardPage() {
  const state = useAppState();
  const nowMs = useNow(60000);
  const now = new Date(nowMs);
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);

  const todaysTasks = selectTodaysTasks(state, nowMs);
  const tasksDone = todaysTasks.filter((t) => t.status === "completed").length;
  const currentActivity =
    [...state.activities]
      .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())
      .find((a) => !a.endedAt) ?? null;
  const todaysSchedule = [...state.calendarEvents].sort(
    (a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime()
  );

  return (
    <>
      <PageHeader title="Dashboard" description="Your command center for today." />

      {/* Morning brief: today's tasks · most important task · free time */}
      <div className="mb-4">
        <DayBriefCard />
      </div>

      <div className="grid gap-4">
        <section className="grid gap-4 md:grid-cols-2">
          <GreetingCard
            tasksDone={tasksDone}
            tasksTotal={todaysTasks.length}
            focusMinutes={selectFocusMinutesToday(state)}
            onAddTask={() => setTaskDialogOpen(true)}
          />
          <CurrentActivityCard activity={currentActivity} />
        </section>

        <section className="grid gap-4 lg:grid-cols-3">
          <TodaysTasksCard tasks={todaysTasks} className="lg:col-span-2" />
          <TodaysScheduleCard events={todaysSchedule} />
        </section>

        <section className="grid gap-4 lg:grid-cols-3">
          <div className="rounded-xl border p-4">
            <GoalsWidget goals={state.goals.filter((g) => !g.archived)} />
          </div>
          <ProjectsWidget
            projects={state.projects.filter((p) => !p.archived)}
            taskCounts={selectProjectTaskCounts(state)}
            className="lg:col-span-2"
          />
          <div className="rounded-xl border p-4">
            <HabitsWidget
              habits={state.habits.filter((h) => !h.archived && isHabitDueOn(h, now))}
            />
          </div>
        </section>
      </div>

      <TaskFormDialog open={taskDialogOpen} onOpenChange={setTaskDialogOpen} />
    </>
  );
}
