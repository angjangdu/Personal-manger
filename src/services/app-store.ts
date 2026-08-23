import type {
  Activity,
  CalendarEvent,
  Goal,
  Habit,
  HabitLog,
  Milestone,
  Project,
  Subtask,
  Tag,
  Task,
} from "@/types";
import {
  mockActivities,
  mockCalendarEvents,
  mockGoals,
  mockHabitLogs,
  mockHabits,
  mockProjects,
  mockTags,
  mockTasks,
} from "@/lib/mock-data";

/**
 * Client-side external store for the demo phase.
 *
 * Backed by localStorage so state survives refresh (FR-016). React binds to it
 * via useSyncExternalStore — the single source of truth for UI mutations.
 * Phase 21+ replaces the persistence internals with Supabase behind the same
 * method surface.
 */

export const STORAGE_KEY = "personal-os-state-v1";

export interface AppState {
  tasks: Task[];
  projects: Project[];
  goals: Goal[];
  habits: Habit[];
  habitLogs: HabitLog[];
  activities: Activity[];
  calendarEvents: CalendarEvent[];
  tags: Tag[];
}

export interface TaskInput {
  title: string;
  description?: string;
  status: Task["status"];
  priority: Task["priority"];
  dueDate?: string;
  dueTime?: string;
  estimatedDurationMinutes?: number;
  projectId?: string;
  goalId?: string;
  tagIds: string[];
}

export interface ProjectInput {
  name: string;
  description?: string;
  color?: string;
  goalId?: string;
  deadline?: string;
}

export interface GoalInput {
  title: string;
  description?: string;
  category?: string;
  deadline?: string;
}

export interface EventInput {
  title: string;
  startAt: string;
  endAt: string;
  allDay: boolean;
  taskId?: string;
}

function seedState(): AppState {
  return {
    tasks: mockTasks,
    projects: mockProjects,
    goals: mockGoals,
    habits: mockHabits,
    habitLogs: mockHabitLogs,
    activities: mockActivities,
    calendarEvents: mockCalendarEvents,
    tags: mockTags,
  };
}

const SERVER_SNAPSHOT = seedState();

function loadState(): AppState {
  if (typeof window === "undefined") return SERVER_SNAPSHOT;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return SERVER_SNAPSHOT;
    return { ...SERVER_SNAPSHOT, ...(JSON.parse(raw) as AppState) };
  } catch {
    return SERVER_SNAPSHOT;
  }
}

function persist(state: AppState) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage full/unavailable — demo keeps working in memory.
  }
}

class AppStore {
  private state: AppState = SERVER_SNAPSHOT;
  private listeners = new Set<() => void>();

  /** Called once on the client before first subscription. */
  hydrate() {
    this.state = loadState();
    this.emit();
  }

  getState = (): AppState => this.state;

  getServerSnapshot = (): AppState => SERVER_SNAPSHOT;

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  private emit() {
    persist(this.state);
    for (const listener of this.listeners) listener();
  }

  private set(mutator: (state: AppState) => AppState) {
    this.state = mutator(this.state);
    this.emit();
  }

  // ── Tasks ────────────────────────────────────────────────────────────────

  addTask(input: TaskInput): Task {
    const nowIso = new Date().toISOString();
    const task: Task = {
      id: crypto.randomUUID(),
      title: input.title.trim(),
      description: input.description?.trim() || undefined,
      status: input.status,
      priority: input.priority,
      dueDate: input.dueDate || undefined,
      dueTime: input.dueTime || undefined,
      estimatedDurationMinutes: input.estimatedDurationMinutes || undefined,
      projectId: input.projectId || undefined,
      goalId: input.goalId || undefined,
      tagIds: input.tagIds,
      subtasks: [],
      createdAt: nowIso,
      updatedAt: nowIso,
    };
    this.set((s) => ({ ...s, tasks: [task, ...s.tasks] }));
    return task;
  }

  updateTask(id: string, patch: Partial<TaskInput>) {
    this.set((s) => ({
      ...s,
      tasks: s.tasks.map((task) =>
        task.id === id
          ? {
              ...task,
              ...patch,
              title: patch.title?.trim() || task.title,
              description: patch.description?.trim() || undefined,
              dueDate: patch.dueDate || undefined,
              dueTime: patch.dueTime || undefined,
              estimatedDurationMinutes: patch.estimatedDurationMinutes || undefined,
              projectId: patch.projectId || undefined,
              goalId: patch.goalId || undefined,
              tagIds: patch.tagIds ?? task.tagIds,
              updatedAt: new Date().toISOString(),
            }
          : task
      ),
    }));
  }

  deleteTask(id: string) {
    this.set((s) => ({ ...s, tasks: s.tasks.filter((task) => task.id !== id) }));
  }

  setTaskStatus(id: string, status: Task["status"]) {
    this.set((s) => ({
      ...s,
      tasks: s.tasks.map((task) =>
        task.id === id
          ? {
              ...task,
              status,
              completedAt:
                status === "completed" ? new Date().toISOString() : undefined,
              updatedAt: new Date().toISOString(),
            }
          : task
      ),
    }));
  }

  toggleTaskComplete(id: string) {
    const task = this.state.tasks.find((t) => t.id === id);
    if (!task) return;
    this.setTaskStatus(id, task.status === "completed" ? "planned" : "completed");
  }

  addSubtask(taskId: string, title: string) {
    const trimmed = title.trim();
    if (!trimmed) return;
    this.set((s) => ({
      ...s,
      tasks: s.tasks.map((task) =>
        task.id === taskId
          ? {
              ...task,
              subtasks: [
                ...task.subtasks,
                {
                  id: crypto.randomUUID(),
                  taskId,
                  title: trimmed,
                  completed: false,
                  order: task.subtasks.length,
                  createdAt: new Date().toISOString(),
                } satisfies Subtask,
              ],
              updatedAt: new Date().toISOString(),
            }
          : task
      ),
    }));
  }

  toggleSubtask(taskId: string, subtaskId: string) {
    this.set((s) => ({
      ...s,
      tasks: s.tasks.map((task) =>
        task.id === taskId
          ? {
              ...task,
              subtasks: task.subtasks.map((sub) =>
                sub.id === subtaskId ? { ...sub, completed: !sub.completed } : sub
              ),
              updatedAt: new Date().toISOString(),
            }
          : task
      ),
    }));
  }

  deleteSubtask(taskId: string, subtaskId: string) {
    this.set((s) => ({
      ...s,
      tasks: s.tasks.map((task) =>
        task.id === taskId
          ? {
              ...task,
              subtasks: task.subtasks.filter((sub) => sub.id !== subtaskId),
              updatedAt: new Date().toISOString(),
            }
          : task
      ),
    }));
  }

  // ── Projects ─────────────────────────────────────────────────────────────

  addProject(input: ProjectInput): Project {
    const nowIso = new Date().toISOString();
    const project: Project = {
      id: crypto.randomUUID(),
      name: input.name.trim(),
      description: input.description?.trim() || undefined,
      color: input.color,
      goalId: input.goalId || undefined,
      deadline: input.deadline || undefined,
      archived: false,
      createdAt: nowIso,
      updatedAt: nowIso,
    };
    this.set((s) => ({ ...s, projects: [project, ...s.projects] }));
    return project;
  }

  updateProject(id: string, patch: Partial<ProjectInput> & { archived?: boolean }) {
    this.set((s) => ({
      ...s,
      projects: s.projects.map((project) =>
        project.id === id
          ? {
              ...project,
              ...patch,
              name: patch.name?.trim() || project.name,
              description: patch.description?.trim() || undefined,
              goalId: patch.goalId !== undefined ? patch.goalId || undefined : project.goalId,
              deadline: patch.deadline !== undefined ? patch.deadline || undefined : project.deadline,
              updatedAt: new Date().toISOString(),
            }
          : project
      ),
    }));
  }

  setProjectArchived(id: string, archived: boolean) {
    this.updateProject(id, { archived });
  }

  /** Deletes a project and detaches its tasks (tasks are kept, orphaned). */
  deleteProject(id: string) {
    const nowIso = new Date().toISOString();
    this.set((s) => ({
      ...s,
      projects: s.projects.filter((project) => project.id !== id),
      tasks: s.tasks.map((task) =>
        task.projectId === id
          ? { ...task, projectId: undefined, updatedAt: nowIso }
          : task
      ),
    }));
  }

  // ── Goals ────────────────────────────────────────────────────────────────

  addGoal(input: GoalInput): Goal {
    const nowIso = new Date().toISOString();
    const goal: Goal = {
      id: crypto.randomUUID(),
      title: input.title.trim(),
      description: input.description?.trim() || undefined,
      category: input.category?.trim() || undefined,
      deadline: input.deadline || undefined,
      milestones: [],
      projectIds: [],
      progressPercent: 0,
      archived: false,
      createdAt: nowIso,
      updatedAt: nowIso,
    };
    this.set((s) => ({ ...s, goals: [goal, ...s.goals] }));
    return goal;
  }

  updateGoal(id: string, patch: Partial<GoalInput> & { archived?: boolean }) {
    this.set((s) => ({
      ...s,
      goals: s.goals.map((goal) =>
        goal.id === id
          ? {
              ...goal,
              ...patch,
              title: patch.title?.trim() || goal.title,
              description: patch.description !== undefined ? patch.description?.trim() || undefined : goal.description,
              category: patch.category !== undefined ? patch.category?.trim() || undefined : goal.category,
              deadline: patch.deadline !== undefined ? patch.deadline || undefined : goal.deadline,
              updatedAt: new Date().toISOString(),
            }
          : goal
      ),
    }));
  }

  setGoalArchived(id: string, archived: boolean) {
    this.updateGoal(id, { archived });
  }

  /** Deletes a goal and detaches its projects and tasks (both are kept). */
  deleteGoal(id: string) {
    const nowIso = new Date().toISOString();
    this.set((s) => ({
      ...s,
      goals: s.goals.filter((goal) => goal.id !== id),
      projects: s.projects.map((project) =>
        project.goalId === id
          ? { ...project, goalId: undefined, updatedAt: nowIso }
          : project
      ),
      tasks: s.tasks.map((task) =>
        task.goalId === id ? { ...task, goalId: undefined, updatedAt: nowIso } : task
      ),
    }));
  }

  // ── Milestones ───────────────────────────────────────────────────────────

  addMilestone(goalId: string, title: string) {
    const trimmed = title.trim();
    if (!trimmed) return;
    const milestone: Milestone = {
      id: crypto.randomUUID(),
      goalId,
      title: trimmed,
      createdAt: new Date().toISOString(),
    };
    this.set((s) => ({
      ...s,
      goals: s.goals.map((goal) =>
        goal.id === goalId
          ? { ...goal, milestones: [...goal.milestones, milestone], updatedAt: new Date().toISOString() }
          : goal
      ),
    }));
  }

  toggleMilestone(goalId: string, milestoneId: string) {
    this.set((s) => ({
      ...s,
      goals: s.goals.map((goal) =>
        goal.id === goalId
          ? {
              ...goal,
              milestones: goal.milestones.map((m) =>
                m.id === milestoneId
                  ? { ...m, completedAt: m.completedAt ? undefined : new Date().toISOString() }
                  : m
              ),
              updatedAt: new Date().toISOString(),
            }
          : goal
      ),
    }));
  }

  deleteMilestone(goalId: string, milestoneId: string) {
    this.set((s) => ({
      ...s,
      goals: s.goals.map((goal) =>
        goal.id === goalId
          ? {
              ...goal,
              milestones: goal.milestones.filter((m) => m.id !== milestoneId),
              updatedAt: new Date().toISOString(),
            }
          : goal
      ),
    }));
  }

  // ── Calendar events ──────────────────────────────────────────────────────

  addEvent(input: EventInput): CalendarEvent {
    const event: CalendarEvent = {
      id: crypto.randomUUID(),
      title: input.title.trim(),
      startAt: input.startAt,
      endAt: input.endAt,
      allDay: input.allDay,
      taskId: input.taskId || undefined,
      createdAt: new Date().toISOString(),
    };
    this.set((s) => ({ ...s, calendarEvents: [event, ...s.calendarEvents] }));
    return event;
  }

  updateEvent(id: string, patch: Partial<EventInput>) {
    this.set((s) => ({
      ...s,
      calendarEvents: s.calendarEvents.map((event) =>
        event.id === id
          ? {
              ...event,
              ...patch,
              title: patch.title?.trim() || event.title,
              taskId:
                patch.taskId !== undefined
                  ? patch.taskId || undefined
                  : event.taskId,
            }
          : event
      ),
    }));
  }

  deleteEvent(id: string) {
    this.set((s) => ({
      ...s,
      calendarEvents: s.calendarEvents.filter((event) => event.id !== id),
    }));
  }

  // ── Activities ───────────────────────────────────────────────────────────
  // Durations are always computed from timestamps, never trusted from a
  // client timer (architecture doc §9).

  startActivity(input: {
    title: string;
    taskId?: string;
    projectId?: string;
  }): Activity | null {
    if (this.state.activities.some((a) => !a.endedAt)) return null;
    const nowIso = new Date().toISOString();
    const activity: Activity = {
      id: crypto.randomUUID(),
      title: input.title.trim(),
      taskId: input.taskId || undefined,
      projectId: input.projectId || undefined,
      startedAt: nowIso,
      totalPausedMs: 0,
      createdAt: nowIso,
    };
    this.set((s) => ({ ...s, activities: [activity, ...s.activities] }));
    return activity;
  }

  pauseActivity(id: string) {
    this.set((s) => ({
      ...s,
      activities: s.activities.map((activity) =>
        activity.id === id && !activity.endedAt && !activity.pausedAt
          ? { ...activity, pausedAt: new Date().toISOString() }
          : activity
      ),
    }));
  }

  resumeActivity(id: string) {
    const activity = this.state.activities.find((a) => a.id === id);
    if (!activity || !activity.pausedAt || activity.endedAt) return;
    const pausedFor =
      Date.now() - new Date(activity.pausedAt).getTime();
    this.set((s) => ({
      ...s,
      activities: s.activities.map((a) =>
        a.id === id
          ? {
              ...a,
              totalPausedMs: a.totalPausedMs + pausedFor,
              pausedAt: undefined,
            }
          : a
      ),
    }));
  }

  stopActivity(id: string) {
    const activity = this.state.activities.find((a) => a.id === id);
    if (!activity || activity.endedAt) return;

    // Stopping while paused freezes the session at the pause point —
    // the pause was intentional time away, not tracked work.
    const endMs = activity.pausedAt
      ? new Date(activity.pausedAt).getTime()
      : Date.now();
    const durationMinutes = Math.max(
      1,
      Math.round(
        (endMs - new Date(activity.startedAt).getTime() - activity.totalPausedMs) /
          60000
      )
    );
    this.set((s) => ({
      ...s,
      activities: s.activities.map((a) =>
        a.id === id
          ? {
              ...a,
              endedAt: new Date(endMs).toISOString(),
              pausedAt: undefined,
              durationMinutes,
            }
          : a
      ),
    }));
  }

  deleteActivity(id: string) {
    this.set((s) => ({
      ...s,
      activities: s.activities.filter((activity) => activity.id !== id),
    }));
  }

  updateActivityNotes(id: string, notes: string) {
    this.set((s) => ({
      ...s,
      activities: s.activities.map((activity) =>
        activity.id === id
          ? { ...activity, notes: notes.trim() || undefined }
          : activity
      ),
    }));
  }
}

export const appStore = new AppStore();

if (typeof window !== "undefined") {
  appStore.hydrate();
}
