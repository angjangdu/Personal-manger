import type {
  Activity,
  CalendarEvent,
  Goal,
  Habit,
  Project,
  Task,
} from "@/types";
import { isSameDay, startOfDay } from "@/lib/date-utils";
import {
  mockActivities,
  mockCalendarEvents,
  mockGoals,
  mockHabitLogs,
  mockHabits,
  mockProjects,
  mockTasks,
} from "@/lib/mock-data";

/**
 * Application-service layer for the dashboard.
 * Reads from mock fixtures today; the interface stays stable when the
 * backend is introduced (Phase 21+).
 */

export interface DashboardData {
  todaysTasks: Task[];
  todaysSchedule: CalendarEvent[];
  currentActivity: Activity | null;
  recentActivities: Activity[];
  activeGoals: Goal[];
  activeProjects: Project[];
  projectTaskCounts: Record<string, { total: number; completed: number }>;
  habits: Habit[];
  habitLogsToday: string[];
  focusMinutesToday: number;
}

export function getDashboardData(): DashboardData {
  const today = startOfDay();

  const todaysTasks = mockTasks.filter(
    (task) => task.dueDate && isSameDay(new Date(task.dueDate), today)
  );

  const todaysSchedule = [...mockCalendarEvents]
    .filter((event) => isSameDay(new Date(event.startAt), today))
    .sort(
      (a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime()
    );

  const sortedActivities = [...mockActivities].sort(
    (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
  );
  const currentActivity =
    sortedActivities.find((activity) => !activity.endedAt) ?? null;

  const focusMinutesToday = mockActivities
    .filter((a) => a.endedAt && isSameDay(new Date(a.startedAt), today))
    .reduce((sum, a) => sum + (a.durationMinutes ?? 0), 0);

  const projectTaskCounts: DashboardData["projectTaskCounts"] = {};
  for (const project of mockProjects) {
    const tasks = mockTasks.filter((task) => task.projectId === project.id);
    projectTaskCounts[project.id] = {
      total: tasks.length,
      completed: tasks.filter((task) => task.status === "completed").length,
    };
  }

  return {
    todaysTasks,
    todaysSchedule,
    currentActivity,
    recentActivities: sortedActivities.slice(0, 5),
    activeGoals: mockGoals.filter((goal) => !goal.archived),
    activeProjects: mockProjects.filter((project) => !project.archived),
    projectTaskCounts,
    habits: mockHabits.filter((habit) => !habit.archived),
    habitLogsToday: mockHabitLogs
      .filter((log) => isSameDay(new Date(log.completedOn), today))
      .map((log) => log.habitId),
    focusMinutesToday,
  };
}
