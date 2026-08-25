import type {
  Activity,
  Attachment,
  CalendarEvent,
  DailyReview,
  Goal,
  Habit,
  HabitGraceLog,
  HabitLog,
  Milestone,
  Note,
  OccurrenceOverride,
  Project,
  ProjectStatus,
  RescheduleLog,
  StudySession,
  StudySubject,
  StudyTopic,
  Subtask,
  Tag,
  Task,
  UserSettings,
} from "@/types";
import { parseVirtualId } from "@/lib/recurrence";
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
  /** Per-occurrence completions/skips for recurring tasks: templateId → dateKey → override. */
  occurrenceOverrides: Record<string, Record<string, OccurrenceOverride>>;
  rescheduleLogs: RescheduleLog[];
  /** Local preferences (sleep window, etc.). */
  settings: UserSettings;
  /** Excused habit misses. */
  habitGraceLogs: HabitGraceLog[];
  /** Uploaded file metadata (blobs live in IndexedDB). */
  attachments: Attachment[];
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
  repeat?: Task["repeat"];
  mit?: boolean;
}

export interface ProjectInput {
  name: string;
  description?: string;
  color?: string;
  goalId?: string;
  deadline?: string;
  status?: ProjectStatus;
}

export interface GoalInput {
  title: string;
  description?: string;
  category?: string;
  deadline?: string;
}

export interface EventInput {  title: string;
  startAt: string;
  endAt: string;
  allDay: boolean;
  taskId?: string;
  repeat?: CalendarEvent["repeat"];
  category?: CalendarEvent["category"];
}

export interface ManualActivityInput {
  title: string;
  taskId?: string;
  projectId?: string;
  category?: Activity["category"];
  /** "YYYY-MM-DD" */
  date: string;
  /** "HH:MM" session start. */
  startTime: string;
  durationMinutes: number;
  notes?: string;
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
  folder?: string;
  pinned?: boolean;
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
    occurrenceOverrides: {},
    rescheduleLogs: [],
    settings: { sleepStart: "23:00", sleepEnd: "07:00" },
    habitGraceLogs: [],
    attachments: [],
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
    // (section)
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

  // (section)

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
      repeat: input.repeat,
      mit: input.mit ?? false,
      createdAt: nowIso,
      updatedAt: nowIso,
    };
    this.set((s) => ({ ...s, tasks: [task, ...s.tasks] }));
    return task;
  }

  /** Deletes a task series (template + all its occurrence overrides). */
  deleteTask(id: string) {
    this.set((s) => {
      const overrides = { ...s.occurrenceOverrides };
      delete overrides[id];
      return {
        ...s,
        tasks: s.tasks.filter((task) => task.id !== id),
        occurrenceOverrides: overrides,
      };
    });
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
              repeat: patch.repeat !== undefined ? patch.repeat : task.repeat,
              mit: patch.mit !== undefined ? patch.mit : task.mit,
              updatedAt: new Date().toISOString(),
            }
          : task
      ),
    }));
  }

  /** Writes/removes an occurrence override for a recurring task. */
  private writeOverride(
    templateId: string,
    dateKey: string,
    mutate: (prev: OccurrenceOverride | undefined) => OccurrenceOverride | null
  ) {
    this.set((s) => {
      const templateOverrides = { ...(s.occurrenceOverrides[templateId] ?? {}) };
      const next = mutate(templateOverrides[dateKey]);
      if (next === null) delete templateOverrides[dateKey];
      else templateOverrides[dateKey] = next;
      return {
        ...s,
        occurrenceOverrides: {
          ...s.occurrenceOverrides,
          [templateId]: templateOverrides,
        },
      };
    });
  }

  toggleTaskComplete(id: string) {
    const virtual = parseVirtualId(id);
    if (virtual) {
      this.writeOverride(virtual.templateId, virtual.dateKey, (prev) =>
        prev?.done
          ? { skipped: prev.skipped }
          : { done: true, completedAt: new Date().toISOString() }
      );
      return;
    }
    const task = this.state.tasks.find((t) => t.id === id);
    if (!task) return;
    this.setTaskStatus(id, task.status === "completed" ? "planned" : "completed");
  }

  setTaskStatus(id: string, status: Task["status"]) {
    const virtual = parseVirtualId(id);
    if (virtual) {
      // Per-occurrence statuses map to done/skip; other states reset the override.
      if (status === "completed") {
        this.writeOverride(virtual.templateId, virtual.dateKey, () => ({
          done: true,
          completedAt: new Date().toISOString(),
        }));
      } else if (status === "cancelled") {
        this.writeOverride(virtual.templateId, virtual.dateKey, () => ({
          skipped: true,
        }));
      } else {
        this.writeOverride(virtual.templateId, virtual.dateKey, () => null);
      }
      return;
    }
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

  // (section)

  addProject(input: ProjectInput): Project {
    const nowIso = new Date().toISOString();
    const project: Project = {
      id: crypto.randomUUID(),
      name: input.name.trim(),
      description: input.description?.trim() || undefined,
      color: input.color,
      goalId: input.goalId || undefined,
      deadline: input.deadline || undefined,
      status: input.status ?? "active",
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
              status: patch.status ?? project.status ?? "active",
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

  // (section)

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

  // (section)

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

  // (section)

  addEvent(input: EventInput): CalendarEvent {
    const event: CalendarEvent = {
      id: crypto.randomUUID(),
      title: input.title.trim(),
      startAt: input.startAt,
      endAt: input.endAt,
      allDay: input.allDay,
      taskId: input.taskId || undefined,
      repeat: input.repeat,
      category: input.category ?? "general",
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
              category: patch.category ?? event.category ?? "general",
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

  /** Records why a scheduled item was moved (feeds reschedule reports). */
  addRescheduleLog(log: Omit<RescheduleLog, "id" | "createdAt">) {
    const entry: RescheduleLog = {
      ...log,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    this.set((s) => ({ ...s, rescheduleLogs: [entry, ...s.rescheduleLogs] }));
  }

  // ── Settings ─────────────────────────────────────────────────────────────

  updateSettings(patch: Partial<UserSettings>) {
    this.set((s) => ({ ...s, settings: { ...s.settings, ...patch } }));
  }

  // ── Habit grace ──────────────────────────────────────────────────────────

  /** Excuses a missed habit day (doesn't break the streak). */
  addHabitGraceLog(
    input: Omit<HabitGraceLog, "id" | "createdAt">
  ) {
    const existing = this.state.habitGraceLogs.find(
      (log) => log.habitId === input.habitId && log.dateKey === input.dateKey
    );
    if (existing) return;
    const entry: HabitGraceLog = {
      ...input,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    this.set((s) => ({ ...s, habitGraceLogs: [entry, ...s.habitGraceLogs] }));
  }

  deleteHabitGraceLog(id: string) {
    this.set((s) => ({
      ...s,
      habitGraceLogs: s.habitGraceLogs.filter((log) => log.id !== id),
    }));
  }

  // ── Attachments ──────────────────────────────────────────────────────────
  // Metadata only — the binary blob must be written to IndexedDB (via
  // services/file-store.ts) under the same id before calling addAttachment.

  addAttachment(attachment: Omit<Attachment, "uploadedAt"> & { uploadedAt?: string }) {
    const entry: Attachment = {
      ...attachment,
      uploadedAt: attachment.uploadedAt ?? new Date().toISOString(),
    };
    this.set((s) => ({ ...s, attachments: [entry, ...s.attachments] }));
    return entry;
  }

  updateAttachmentLinks(
    id: string,
    links: Partial<Pick<Attachment, "noteId" | "taskId" | "projectId" | "studySubjectId" | "studyTopicId">>
  ) {
    this.set((s) => ({
      ...s,
      attachments: s.attachments.map((attachment) =>
        attachment.id === id ? { ...attachment, ...links } : attachment
      ),
    }));
  }

  /** Removes metadata; callers must also delete the IndexedDB blob. */
  deleteAttachment(id: string) {
    this.set((s) => ({
      ...s,
      attachments: s.attachments.filter((attachment) => attachment.id !== id),
    }));
  }

  // (section)
  // Durations are always computed from timestamps, never trusted from a
//   client timer (architecture doc section 9).

  startActivity(input: {
    title: string;
    taskId?: string;
    projectId?: string;
    category?: Activity["category"];
  }): Activity | null {
    if (this.state.activities.some((a) => !a.endedAt)) return null;
    const nowIso = new Date().toISOString();
    const activity: Activity = {
      id: crypto.randomUUID(),
      title: input.title.trim(),
      taskId: input.taskId || undefined,
      projectId: input.projectId || undefined,
      category: input.category,
      startedAt: nowIso,
      totalPausedMs: 0,
      createdAt: nowIso,
    };
    this.set((s) => ({ ...s, activities: [activity, ...s.activities] }));
    return activity;
  }

  /** Adds a past session the user forgot to track (review §10). */
  addManualActivity(input: ManualActivityInput): Activity | null {
    if (this.state.activities.some((a) => !a.endedAt)) return null;
    const [h, m] = input.startTime.split(":").map(Number);
    const start = new Date(input.date + "T00:00:00");
    start.setHours(h || 0, m || 0, 0, 0);
    const duration = Math.max(1, Math.round(input.durationMinutes));
    const activity: Activity = {
      id: crypto.randomUUID(),
      title: input.title.trim(),
      taskId: input.taskId || undefined,
      projectId: input.projectId || undefined,
      category: input.category,
      startedAt: start.toISOString(),
      endedAt: new Date(start.getTime() + duration * 60000).toISOString(),
      totalPausedMs: 0,
      durationMinutes: duration,
      notes: input.notes?.trim() || undefined,
      createdAt: new Date().toISOString(),
    };
    this.set((s) => ({ ...s, activities: [activity, ...s.activities] }));
    return activity;
  }

  updateActivity(
    id: string,
    patch: Partial<
      Pick<
        Activity,
        "category" | "notes" | "title" | "studySubjectId" | "studyTopicId"
      >
    >
  ) {
    this.set((s) => ({
      ...s,
      activities: s.activities.map((activity) =>
        activity.id === id
          ? {
              ...activity,
              ...patch,
              title: patch.title?.trim() || activity.title,
              notes: patch.notes !== undefined ? patch.notes.trim() || undefined : activity.notes,
            }
          : activity
      ),
    }));
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

    // (section)
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

    // Study-linked sessions (review §14): stopping the timer records a
    // study session automatically.
    if (activity.studySubjectId) {
      const sessionDate = new Date(activity.startedAt);
      const session: StudySession = {
        id: crypto.randomUUID(),
        subjectId: activity.studySubjectId,
        topicId: activity.studyTopicId,
        type: "study",
        date: new Date(
          sessionDate.getFullYear(),
          sessionDate.getMonth(),
          sessionDate.getDate()
        ).toISOString(),
        durationMinutes,
        createdAt: new Date().toISOString(),
      };
      this.set((s) => ({ ...s, studySessions: [session, ...s.studySessions] }));
    }
  }

  deleteActivity(id: string) {
    this.set((s) => ({
      ...s,
      activities: s.activities.filter((activity) => activity.id !== id),
    }));
  }


  // (section)

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

  // (section)

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

  // (section)

  addNote(input: NoteInput): Note {
    const nowIso = new Date().toISOString();
    const note: Note = {
      id: crypto.randomUUID(),
      title: input.title.trim() || "Untitled",
      content: input.content,
      folder: input.folder?.trim() || undefined,
      pinned: input.pinned ?? false,
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
              folder:
                patch.folder !== undefined
                  ? patch.folder?.trim() || undefined
                  : note.folder,
              pinned: patch.pinned !== undefined ? patch.pinned : note.pinned,
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
