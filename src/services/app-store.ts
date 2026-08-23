import type {
  Activity,
  CalendarEvent,
  DailyReview,
  Goal,
  Habit,
  HabitLog,
  Milestone,
  Note,
  Project,
  StudySession,
  StudySubject,
  StudyTopic,
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
  mockNotes,
  mockProjects,
  mockStudySessions,
  mockStudySubjects,
  mockStudyTopics,
  mockTags,
  mockTasks,
} from "@/lib/mock-data";

/**
 * Client-side external store for the demo phase.
 *
 * Backed by localStorage so state survives refresh (FR-016). React binds to it
 * via useSyncExternalStore â€” the single source of truth for UI mutations.
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
  studySubjects: StudySubject[];
  studyTopics: StudyTopic[];
  studySessions: StudySession[];
  notes: Note[];
  dailyReviews: DailyReview[];
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

export interface HabitInput {
  name: string;
  description?: string;
  schedule: Habit["schedule"];
  /** JS day indices (0=Sunâ€¦6=Sat) when schedule is weekly. */
  weekdays?: number[];
}

export interface SubjectInput {
  name: string;
  description?: string;
  color?: string;
}

export interface TopicInput {
  subjectId: string;
  parentId?: string;
  name: string;
}

export interface SessionInput {
  subjectId: string;
  topicId?: string;
  type: StudySession["type"];
  date: string;
  durationMinutes: number;
  notes?: string;
}

export interface NoteInput {
  title: string;
  content: string;
  tagIds: string[];
  linkedTaskIds?: string[];
  linkedProjectIds?: string[];
  linkedStudyTopicId?: string;
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
    studySubjects: mockStudySubjects,
    studyTopics: mockStudyTopics,
    studySessions: mockStudySessions,
    notes: mockNotes,
    dailyReviews: [],
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
    // Storage full/unavailable â€” demo keeps working in memory.
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

  // â”€â”€ Tasks â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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

  // â”€â”€ Projects â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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

  // â”€â”€ Goals â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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

  // â”€â”€ Milestones â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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

  // â”€â”€ Calendar events â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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

  // â”€â”€ Activities â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // Durations are always computed from timestamps, never trusted from a
  // client timer (architecture doc Â§9).

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

    // Stopping while paused freezes the session at the pause point â€”
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

  // â”€â”€ Habits â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  addHabit(input: HabitInput): Habit {
    const nowIso = new Date().toISOString();
    const habit: Habit = {
      id: crypto.randomUUID(),
      name: input.name.trim(),
      description: input.description?.trim() || undefined,
      schedule: input.schedule,
      weekdays:
        input.schedule === "weekly"
          ? (input.weekdays?.length ? [...input.weekdays].sort() : [1])
          : undefined,
      archived: false,
      createdAt: nowIso,
    };
    this.set((s) => ({ ...s, habits: [habit, ...s.habits] }));
    return habit;
  }

  updateHabit(id: string, patch: Partial<HabitInput> & { archived?: boolean }) {
    this.set((s) => ({
      ...s,
      habits: s.habits.map((habit) =>
        habit.id === id
          ? {
              ...habit,
              ...patch,
              name: patch.name?.trim() || habit.name,
              description: patch.description !== undefined ? patch.description?.trim() || undefined : habit.description,
              weekdays:
                patch.schedule === "weekly" || (patch.schedule === undefined && habit.schedule === "weekly")
                  ? patch.weekdays && patch.weekdays.length > 0
                    ? [...patch.weekdays].sort()
                    : habit.weekdays
                  : patch.schedule === "daily"
                    ? undefined
                    : habit.weekdays,
            }
          : habit
      ),
    }));
  }

  /** Deletes a habit and its logs. */
  deleteHabit(id: string) {
    this.set((s) => ({
      ...s,
      habits: s.habits.filter((habit) => habit.id !== id),
      habitLogs: s.habitLogs.filter((log) => log.habitId !== id),
    }));
  }

  /** Toggles completion of a habit for a given day (defaults to today). */
  toggleHabitLog(habitId: string, day: Date = new Date()) {
    const d = new Date(day);
    d.setHours(0, 0, 0, 0);
    const dayIso = d.toISOString();
    const existing = this.state.habitLogs.find(
      (log) => log.habitId === habitId && log.completedOn.slice(0, 10) === dayIso.slice(0, 10)
    );
    if (existing) {
      this.set((s) => ({
        ...s,
        habitLogs: s.habitLogs.filter((log) => log.id !== existing.id),
      }));
    } else {
      const log: HabitLog = {
        id: crypto.randomUUID(),
        habitId,
        completedOn: dayIso,
        createdAt: new Date().toISOString(),
      };
      this.set((s) => ({ ...s, habitLogs: [...s.habitLogs, log] }));
    }
  }

  // â”€â”€ Study â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  addSubject(input: SubjectInput): StudySubject {
    const nowIso = new Date().toISOString();
    const subject: StudySubject = {
      id: crypto.randomUUID(),
      name: input.name.trim(),
      description: input.description?.trim() || undefined,
      color: input.color,
      archived: false,
      createdAt: nowIso,
    };
    this.set((s) => ({ ...s, studySubjects: [subject, ...s.studySubjects] }));
    return subject;
  }

  updateSubject(id: string, patch: Partial<SubjectInput> & { archived?: boolean }) {
    this.set((s) => ({
      ...s,
      studySubjects: s.studySubjects.map((subject) =>
        subject.id === id
          ? {
              ...subject,
              ...patch,
              name: patch.name?.trim() || subject.name,
              description: patch.description !== undefined ? patch.description?.trim() || undefined : subject.description,
            }
          : subject
      ),
    }));
  }

  /** Deletes a subject with its topics and sessions. */
  deleteSubject(id: string) {
    this.set((s) => ({
      ...s,
      studySubjects: s.studySubjects.filter((subject) => subject.id !== id),
      studyTopics: s.studyTopics.filter((topic) => topic.subjectId !== id),
      studySessions: s.studySessions.filter((session) => session.subjectId !== id),
    }));
  }

  addTopic(input: TopicInput): StudyTopic | null {
    const trimmed = input.name.trim();
    if (!trimmed) return null;
    const topic: StudyTopic = {
      id: crypto.randomUUID(),
      subjectId: input.subjectId,
      parentId: input.parentId || undefined,
      name: trimmed,
      status: "todo",
      createdAt: new Date().toISOString(),
    };
    this.set((s) => ({ ...s, studyTopics: [...s.studyTopics, topic] }));
    return topic;
  }

  updateTopicStatus(id: string, status: StudyTopic["status"]) {
    this.set((s) => ({
      ...s,
      studyTopics: s.studyTopics.map((topic) =>
        topic.id === id ? { ...topic, status } : topic
      ),
    }));
  }

  deleteTopic(id: string) {
    // Also removes child topics (units own their topics).
    this.set((s) => ({
      ...s,
      studyTopics: s.studyTopics.filter(
        (topic) => topic.id !== id && topic.parentId !== id
      ),
    }));
  }

  /** Logs a study/revision session; revision stamps the topic's lastRevisedAt. */
  addSession(input: SessionInput): StudySession | null {
    const session: StudySession = {
      id: crypto.randomUUID(),
      subjectId: input.subjectId,
      topicId: input.topicId || undefined,
      type: input.type,
      date: input.date,
      durationMinutes: Math.max(1, Math.round(input.durationMinutes)),
      notes: input.notes?.trim() || undefined,
      createdAt: new Date().toISOString(),
    };
    this.set((s) => ({
      ...s,
      studySessions: [session, ...s.studySessions],
      studyTopics:
        session.type === "revision" && session.topicId
          ? s.studyTopics.map((topic) =>
              topic.id === session.topicId
                ? { ...topic, lastRevisedAt: session.date }
                : topic
            )
          : s.studyTopics,
    }));
    return session;
  }

  deleteSession(id: string) {
    this.set((s) => ({
      ...s,
      studySessions: s.studySessions.filter((session) => session.id !== id),
    }));
  }

  // â”€â”€ Notes â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  addNote(input: NoteInput): Note {
    const nowIso = new Date().toISOString();
    const note: Note = {
      id: crypto.randomUUID(),
      title: input.title.trim() || "Untitled",
      content: input.content,
      tagIds: input.tagIds,
      linkedTaskIds: input.linkedTaskIds ?? [],
      linkedProjectIds: input.linkedProjectIds ?? [],
      linkedStudyTopicId: input.linkedStudyTopicId || undefined,
      createdAt: nowIso,
      updatedAt: nowIso,
    };
    this.set((s) => ({ ...s, notes: [note, ...s.notes] }));
    return note;
  }

  updateNote(id: string, patch: Partial<NoteInput>) {
    this.set((s) => ({
      ...s,
      notes: s.notes.map((note) =>
        note.id === id
          ? {
              ...note,
              ...patch,
              title: patch.title?.trim() || note.title,
              linkedStudyTopicId:
                patch.linkedStudyTopicId !== undefined
                  ? patch.linkedStudyTopicId || undefined
                  : note.linkedStudyTopicId,
              updatedAt: new Date().toISOString(),
            }
          : note
      ),
    }));
  }

  deleteNote(id: string) {
    this.set((s) => ({
      ...s,
      notes: s.notes.filter((note) => note.id !== id),
    }));
  }

  // ── Daily reviews ────────────────────────────────────────────────────────

  /** Creates or updates the review for a given day (one per calendar day). */
  upsertDailyReview(
    input: {
      date: string;
      tasksCompletedCount: number;
      focusMinutes: number;
      studyMinutes: number;
    } & Partial<Pick<DailyReview, "wentWell" | "wentWrong" | "toImprove" | "tomorrowPriority">>
  ) {
    const dayIso = input.date.slice(0, 10);
    const existing = this.state.dailyReviews.find(
      (review) => review.date.slice(0, 10) === dayIso
    );
    if (existing) {
      this.set((s) => ({
        ...s,
        dailyReviews: s.dailyReviews.map((review) =>
          review.date.slice(0, 10) === dayIso ? { ...review, ...input } : review
        ),
      }));
    } else {
      const review: DailyReview = {
        id: crypto.randomUUID(),
        date: input.date,
        tasksCompletedCount: input.tasksCompletedCount,
        focusMinutes: input.focusMinutes,
        studyMinutes: input.studyMinutes,
        wentWell: input.wentWell?.trim() || undefined,
        wentWrong: input.wentWrong?.trim() || undefined,
        toImprove: input.toImprove?.trim() || undefined,
        tomorrowPriority: input.tomorrowPriority?.trim() || undefined,
        createdAt: new Date().toISOString(),
      };
      this.set((s) => ({ ...s, dailyReviews: [review, ...s.dailyReviews] }));
    }
  }
}

export const appStore = new AppStore();

if (typeof window !== "undefined") {
  appStore.hydrate();
}
