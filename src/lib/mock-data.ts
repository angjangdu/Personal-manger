import type {
  Activity,
  CalendarEvent,
  Goal,
  Habit,
  HabitLog,
  Project,
  StudySession,
  StudySubject,
  StudyTopic,
  Tag,
  Task,
} from "@/types";
import { startOfDay } from "@/lib/date-utils";

/**
 * Mock fixtures for the demo phase (no auth, no backend).
 * Generated relative to "now" so the dashboard always looks alive.
 */

function todayAt(hours: number, minutes = 0): Date {
  const d = startOfDay();
  d.setHours(hours, minutes, 0, 0);
  return d;
}

function iso(date: Date): string {
  return date.toISOString();
}

const now = new Date();

export const mockProjects: Project[] = [
  {
    id: "proj-physics",
    name: "Mathematical Physics",
    description: "Second-semester coursework and problem sets.",
    color: "#6366f1",
    deadline: iso(new Date(now.getTime() + 14 * 86400000)),
    archived: false,
    createdAt: iso(new Date(now.getTime() - 30 * 86400000)),
    updatedAt: iso(new Date(now.getTime() - 2 * 86400000)),
  },
  {
    id: "proj-os",
    name: "Personal OS Build",
    description: "Ship the productivity platform demo.",
    color: "#10b981",
    deadline: iso(new Date(now.getTime() + 30 * 86400000)),
    archived: false,
    createdAt: iso(new Date(now.getTime() - 21 * 86400000)),
    updatedAt: iso(new Date(now.getTime() - 1 * 86400000)),
  },
  {
    id: "proj-portfolio",
    name: "Portfolio Site",
    description: "Personal site refresh with case studies.",
    color: "#f59e0b",
    deadline: iso(new Date(now.getTime() + 45 * 86400000)),
    archived: false,
    createdAt: iso(new Date(now.getTime() - 60 * 86400000)),
    updatedAt: iso(new Date(now.getTime() - 5 * 86400000)),
  },
];

export const mockGoals: Goal[] = [
  {
    id: "goal-semester",
    title: "Ace this semester",
    description: "Top 10% in every course.",
    category: "Academic",
    deadline: iso(new Date(now.getTime() + 60 * 86400000)),
    milestones: [],
    projectIds: ["proj-physics"],
    progressPercent: 62,
    archived: false,
    createdAt: iso(new Date(now.getTime() - 40 * 86400000)),
    updatedAt: iso(new Date(now.getTime() - 3 * 86400000)),
  },
  {
    id: "goal-product",
    title: "Launch Personal OS demo",
    description: "Complete functional frontend milestone.",
    category: "Project",
    deadline: iso(new Date(now.getTime() + 21 * 86400000)),
    milestones: [],
    projectIds: ["proj-os"],
    progressPercent: 38,
    archived: false,
    createdAt: iso(new Date(now.getTime() - 20 * 86400000)),
    updatedAt: iso(new Date(now.getTime() - 1 * 86400000)),
  },
  {
    id: "goal-fitness",
    title: "Train 4x per week",
    description: "Build a sustainable strength routine.",
    category: "Health",
    deadline: undefined,
    milestones: [],
    projectIds: [],
    progressPercent: 71,
    archived: false,
    createdAt: iso(new Date(now.getTime() - 90 * 86400000)),
    updatedAt: iso(new Date(now.getTime() - 1 * 86400000)),
  },
];

export const mockTags: Tag[] = [  { id: "study", name: "Study", color: "#6366f1" },
  { id: "dev", name: "Dev", color: "#10b981" },
  { id: "writing", name: "Writing", color: "#f59e0b" },
  { id: "planning", name: "Planning", color: "#8b5cf6" },
];

export const mockTasks: Task[] = [
  {
    id: "task-1",
    title: "Finish problem set 4",
    description: "Lagrangian mechanics exercises 1–8.",
    status: "in_progress",
    priority: "high",
    dueDate: iso(todayAt(17, 0)),
    estimatedDurationMinutes: 90,
    projectId: "proj-physics",
    goalId: "goal-semester",
    tagIds: ["study"],
    subtasks: [],
    createdAt: iso(new Date(now.getTime() - 2 * 86400000)),
    updatedAt: iso(now),
  },
  {
    id: "task-2",
    title: "Review calculus notes",
    status: "completed",
    priority: "medium",
    dueDate: iso(todayAt(11, 0)),
    estimatedDurationMinutes: 30,
    projectId: "proj-physics",
    goalId: "goal-semester",
    tagIds: ["study"],
    subtasks: [],
    completedAt: iso(todayAt(10, 42)),
    createdAt: iso(new Date(now.getTime() - 2 * 86400000)),
    updatedAt: iso(todayAt(10, 42)),
  },
  {
    id: "task-3",
    title: "Design task schema",
    status: "completed",
    priority: "urgent",
    dueDate: iso(todayAt(12, 0)),
    estimatedDurationMinutes: 60,
    projectId: "proj-os",
    goalId: "goal-product",
    tagIds: ["dev"],
    subtasks: [],
    completedAt: iso(todayAt(11, 55)),
    createdAt: iso(new Date(now.getTime() - 1 * 86400000)),
    updatedAt: iso(todayAt(11, 55)),
  },
  {
    id: "task-4",
    title: "Wire up sidebar navigation",
    status: "completed",
    priority: "high",
    dueDate: iso(todayAt(15, 0)),
    estimatedDurationMinutes: 45,
    projectId: "proj-os",
    goalId: "goal-product",
    tagIds: ["dev"],
    subtasks: [],
    completedAt: iso(todayAt(14, 20)),
    createdAt: iso(new Date(now.getTime() - 1 * 86400000)),
    updatedAt: iso(todayAt(14, 20)),
  },
  {
    id: "task-5",
    title: "Draft portfolio case study",
    status: "planned",
    priority: "low",
    dueDate: iso(todayAt(20, 0)),
    estimatedDurationMinutes: 60,
    projectId: "proj-portfolio",
    tagIds: ["writing"],
    subtasks: [],
    createdAt: iso(new Date(now.getTime() - 4 * 86400000)),
    updatedAt: iso(new Date(now.getTime() - 4 * 86400000)),
  },
  {
    id: "task-6",
    title: "Plan tomorrow's deep work",
    status: "inbox",
    priority: "medium",
    estimatedDurationMinutes: 15,
    tagIds: ["planning"],
    subtasks: [],
    createdAt: iso(now),
    updatedAt: iso(now),
  },
];

export const mockCalendarEvents: CalendarEvent[] = [
  {
    id: "evt-standup",
    title: "Weekly review prep",
    startAt: iso(todayAt(9, 0)),
    endAt: iso(todayAt(9, 30)),
    allDay: false,
    createdAt: iso(new Date(now.getTime() - 7 * 86400000)),
  },
  {
    id: "evt-deepwork",
    title: "Deep work — Physics",
    taskId: "task-1",
    startAt: iso(todayAt(10, 0)),
    endAt: iso(todayAt(12, 0)),
    allDay: false,
    createdAt: iso(new Date(now.getTime() - 1 * 86400000)),
  },
  {
    id: "evt-study",
    title: "Study session — Calculus",
    startAt: iso(todayAt(16, 0)),
    endAt: iso(todayAt(17, 30)),
    allDay: false,
    createdAt: iso(new Date(now.getTime() - 1 * 86400000)),
  },
  {
    id: "evt-gym",
    title: "Strength training",
    startAt: iso(todayAt(18, 30)),
    endAt: iso(todayAt(19, 30)),
    allDay: false,
    createdAt: iso(new Date(now.getTime() - 3 * 86400000)),
  },
];

export const mockActivities: Activity[] = [
  {
    id: "act-morning",
    title: "Calculus review",
    taskId: "task-2",
    projectId: "proj-physics",
    startedAt: iso(todayAt(10, 0)),
    endedAt: iso(todayAt(10, 45)),
    totalPausedMs: 0,
    durationMinutes: 45,
    createdAt: iso(todayAt(10, 0)),
  },
  {
    id: "act-schema",
    title: "Task schema design",
    taskId: "task-3",
    projectId: "proj-os",
    startedAt: iso(todayAt(11, 0)),
    endedAt: iso(todayAt(12, 5)),
    totalPausedMs: 300000,
    durationMinutes: 60,
    createdAt: iso(todayAt(11, 0)),
  },
  {
    id: "act-current",
    title: "Mathematical Physics — problem set",
    taskId: "task-1",
    projectId: "proj-physics",
    startedAt: iso(new Date(now.getTime() - 42 * 60000)),
    totalPausedMs: 0,
    createdAt: iso(new Date(now.getTime() - 42 * 60000)),
  },
];

export const mockHabits: Habit[] = [
  { id: "habit-read", name: "Read 30 minutes", schedule: "daily", archived: false, createdAt: iso(new Date(now.getTime() - 100 * 86400000)) },
  { id: "habit-water", name: "Drink 2L water", schedule: "daily", archived: false, createdAt: iso(new Date(now.getTime() - 80 * 86400000)) },
  { id: "habit-journal", name: "Evening journal", schedule: "daily", archived: false, createdAt: iso(new Date(now.getTime() - 50 * 86400000)) },
  { id: "habit-workout", name: "Workout", schedule: "weekly", weekdays: [1, 3, 5], archived: false, createdAt: iso(new Date(now.getTime() - 90 * 86400000)) },
];

export const mockHabitLogs: HabitLog[] = [
  { id: "log-1", habitId: "habit-read", completedOn: iso(startOfDay()), createdAt: iso(todayAt(8, 0)) },
  { id: "log-2", habitId: "habit-water", completedOn: iso(startOfDay()), createdAt: iso(todayAt(13, 0)) },
];

// ── Study ──────────────────────────────────────────────────────────────────

export const mockStudySubjects: StudySubject[] = [
  {
    id: "subj-physics",
    name: "Mathematical Physics",
    description: "Second-semester methods course.",
    color: "#6366f1",
    archived: false,
    createdAt: iso(new Date(now.getTime() - 30 * 86400000)),
  },
  {
    id: "subj-calculus",
    name: "Calculus",
    description: "Differential equations and series.",
    color: "#10b981",
    archived: false,
    createdAt: iso(new Date(now.getTime() - 45 * 86400000)),
  },
];

export const mockStudyTopics: StudyTopic[] = [
  // Physics — units + topics
  { id: "top-units-mech", subjectId: "subj-physics", name: "Classical Mechanics", status: "learning", createdAt: iso(new Date(now.getTime() - 30 * 86400000)) },
  { id: "top-lagrangian", subjectId: "subj-physics", parentId: "top-units-mech", name: "Lagrangian Dynamics", status: "learning", lastRevisedAt: iso(new Date(now.getTime() - 3 * 86400000)), createdAt: iso(new Date(now.getTime() - 28 * 86400000)) },
  { id: "top-hamiltonian", subjectId: "subj-physics", parentId: "top-units-mech", name: "Hamiltonian Mechanics", status: "todo", createdAt: iso(new Date(now.getTime() - 28 * 86400000)) },
  { id: "top-variational", subjectId: "subj-physics", parentId: "top-units-mech", name: "Variational Principles", status: "mastered", lastRevisedAt: iso(new Date(now.getTime() - 10 * 86400000)), createdAt: iso(new Date(now.getTime() - 27 * 86400000)) },
  { id: "top-units-elec", subjectId: "subj-physics", name: "Electrodynamics", status: "todo", createdAt: iso(new Date(now.getTime() - 20 * 86400000)) },
  { id: "top-maxwell", subjectId: "subj-physics", parentId: "top-units-elec", name: "Maxwell Equations", status: "learning", createdAt: iso(new Date(now.getTime() - 18 * 86400000)) },
  // Calculus
  { id: "top-units-ode", subjectId: "subj-calculus", name: "Differential Equations", status: "learning", createdAt: iso(new Date(now.getTime() - 40 * 86400000)) },
  { id: "top-odes", subjectId: "subj-calculus", parentId: "top-units-ode", name: "First-Order ODEs", status: "mastered", lastRevisedAt: iso(new Date(now.getTime() - 6 * 86400000)), createdAt: iso(new Date(now.getTime() - 38 * 86400000)) },
  { id: "top-series", subjectId: "subj-calculus", parentId: "top-units-ode", name: "Series Solutions", status: "learning", lastRevisedAt: iso(new Date(now.getTime() - 2 * 86400000)), createdAt: iso(new Date(now.getTime() - 25 * 86400000)) },
];

export const mockStudySessions: StudySession[] = [
  { id: "sess-1", subjectId: "subj-physics", topicId: "top-lagrangian", type: "study", date: iso(new Date(now.getTime() - 3 * 86400000)), durationMinutes: 90, notes: "Worked through Euler-Lagrange derivations.", createdAt: iso(new Date(now.getTime() - 3 * 86400000)) },
  { id: "sess-2", subjectId: "subj-calculus", topicId: "top-series", type: "revision", date: iso(new Date(now.getTime() - 2 * 86400000)), durationMinutes: 45, createdAt: iso(new Date(now.getTime() - 2 * 86400000)) },
  { id: "sess-3", subjectId: "subj-physics", topicId: "top-maxwell", type: "study", date: iso(todayAt(16, 0)), durationMinutes: 60, createdAt: iso(todayAt(16, 0)) },
];
