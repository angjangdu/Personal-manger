import { PageHeader } from "@/components/layout/page-header";
import { CurrentActivityCard } from "@/components/dashboard/current-activity-card";
import { GoalsWidget } from "@/components/dashboard/goals-widget";
import { GreetingCard } from "@/components/dashboard/greeting-card";
import { HabitsWidget } from "@/components/dashboard/habits-widget";
import { ProjectsWidget } from "@/components/dashboard/projects-widget";
import { TodaysScheduleCard } from "@/components/dashboard/todays-schedule-card";
import { TodaysTasksCard } from "@/components/dashboard/todays-tasks-card";
import { getDashboardData } from "@/services/dashboard";

export default function DashboardPage() {
  const data = getDashboardData();
  const tasksDone = data.todaysTasks.filter((t) => t.status === "completed").length;

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Your command center for today."
      />
      <div className="grid gap-4">
        <section className="grid gap-4 md:grid-cols-2">
          <GreetingCard
            tasksDone={tasksDone}
            tasksTotal={data.todaysTasks.length}
            focusMinutes={data.focusMinutesToday}
          />
          <CurrentActivityCard activity={data.currentActivity} />
        </section>

        <section className="grid gap-4 lg:grid-cols-3">
          <TodaysTasksCard tasks={data.todaysTasks} className="lg:col-span-2" />
          <TodaysScheduleCard events={data.todaysSchedule} />
        </section>

        <section className="grid gap-4 lg:grid-cols-3">
          <div className="rounded-xl border p-4">
            <GoalsWidget goals={data.activeGoals} />
          </div>
          <ProjectsWidget projects={data.activeProjects} taskCounts={data.projectTaskCounts} className="lg:col-span-2" />
          <div className="rounded-xl border p-4">
            <HabitsWidget habits={data.habits} completedHabitIds={data.habitLogsToday} />
          </div>
        </section>
      </div>
    </>
  );
}
