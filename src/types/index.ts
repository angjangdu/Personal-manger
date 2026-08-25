/**
 * Core domain types — derived from Personal OS SRS v2.0 (Section 6: Data Requirements).
 * These types are the single source of truth shared by UI, services, and future backend.
 */

export type TaskStatus = "inbox" | "planned" | "in_progress" | "completed" | "cancelled";

export type Priority = "low" | "medium" | "high" | "urgent";

/**
 * Recurrence rule. Occurrences are generated virtually from the anchor date;
 * each occurrence is completed/skipped independently via occurrence overrides.
 */
export interface RecurrenceRule {
  freq:
    | "daily"
    | "weekdays"
    | "weekly"
    | "biweekly"
    | "monthly"
    | "yearly"
    | "custom";
  /** JS day indices (0=Sun…6=Sat) for weekly/custom rules. */
  weekdays?: number[];
}

/** Marker attached to virtually-generated occurrences (never persisted). */
export interface VirtualOccurrence {
  templateId: string;
  dateKey: string;
}

export interface OccurrenceOverride {
  done?: boolean;
  skipped?: boolean;
  completedAt?: string;
}

export interface Subtask {
  id: string;
  taskId: string;
  title: string;
  completed: boolean;
  order: number;
  createdAt: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: Priority;
  dueDate?: string;
  dueTime?: string;
  estimatedDurationMinutes?: number;
  projectId?: string;
  goalId?: string;
  tagIds: string[];
  subtasks: Subtask[];
  repeat?: RecurrenceRule;
  /** Most Important Task — highlighted on the Dashboard. */
  mit?: boolean;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
  /** Present only on generated occurrences at runtime. */
  virtual?: VirtualOccurrence;
  /** True when this occurrence was explicitly skipped. */
  skipped?: boolean;
}

export type ProjectStatus =
  | "not_started"
  | "active"
  | "on_hold"
  | "completed";

export interface Project {
  id: string;
  name: string;
  description?: string;
  color?: string;
  goalId?: string;
  deadline?: string;
  status?: ProjectStatus;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Milestone {
  id: string;
  goalId: string;
  title: string;
  targetDate?: string;
  completedAt?: string;
  createdAt: string;
}

export interface Goal {
  id: string;
  title: string;
  description?: string;
  category?: string;
  deadline?: string;
  milestones: Milestone[];
  projectIds: string[];
  progressPercent: number;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
}

export type ActivityCategory =
  | "study"
  | "coding"
  | "college"
  | "project"
  | "work"
  | "exercise"
  | "personal"
  | "other";

export interface Activity {
  id: string;
  title: string;
  taskId?: string;
  projectId?: string;
  category?: ActivityCategory;
  /** Links a tracked session to the study hierarchy (review §14). */
  studySubjectId?: string;
  studyTopicId?: string;
  startedAt: string;
  endedAt?: string;
  pausedAt?: string;
  totalPausedMs: number;
  /** Always computed from timestamps, never trusted from a client timer. */
  durationMinutes?: number;
  notes?: string;
  createdAt: string;
}

export interface Habit {
  id: string;
  name: string;
  description?: string;
  schedule: "daily" | "weekly";
  weekdays?: number[];
  archived: boolean;
  createdAt: string;
}

export interface HabitLog {
  id: string;
  habitId: string;
  completedOn: string;
  createdAt: string;
}

export type EventCategory =
  | "general"
  | "class"
  | "work"
  | "study"
  | "project"
  | "personal";

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startAt: string;
  endAt: string;
  allDay: boolean;
  taskId?: string;
  activityId?: string;
  repeat?: RecurrenceRule;
  category?: EventCategory;
  createdAt: string;
}

/** Why a scheduled item was moved — feeds rescheduling reports. */
export interface RescheduleLog {
  id: string;
  itemId: string;
  itemType: "event";
  title: string;
  fromStart: string;
  toStart: string;
  reason:
    | "not_enough_time"
    | "higher_priority"
    | "unexpected_event"
    | "too_tired"
    | "took_longer"
    | "personal"
    | "other";
  note?: string;
  createdAt: string;
}

/** Local user preferences. */
export interface UserSettings {
  /** "HH:MM" — when the user goes to sleep. */
  sleepStart: string;
  /** "HH:MM" — when the user wakes up. */
  sleepEnd: string;
  /** Report section ids hidden by the user (customizable report). */
  hiddenReportSections?: string[];
}

/** Excused habit miss — doesn't break streaks (review §13 grace flow). */
export interface HabitGraceLog {
  id: string;
  habitId: string;
  dateKey: string;
  reason:
    | "forgot"
    | "too_busy"
    | "too_tired"
    | "not_feeling_well"
    | "other";
  note?: string;
  createdAt: string;
}

export interface Tag {
  id: string;
  name: string;
  color?: string;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  folder?: string;
  pinned?: boolean;
  tagIds: string[];
  linkedTaskIds: string[];
  linkedProjectIds: string[];
  linkedStudyTopicId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DailyReview {
  id: string;
  date: string;
  tasksCompletedCount: number;
  focusMinutes: number;
  studyMinutes: number;
  wentWell?: string;
  wentWrong?: string;
  toImprove?: string;
  tomorrowPriority?: string;
  createdAt: string;
}

// ── Study ──────────────────────────────────────────────────────────────────
// Hierarchy: Subject (course) → Unit → Topic → Study Session → Revision

export interface StudySubject {
  id: string;
  name: string;
  description?: string;
  color?: string;
  archived: boolean;
  createdAt: string;
}

export type StudyTopicStatus = "todo" | "learning" | "mastered";

export interface StudyTopic {
  id: string;
  subjectId: string;
  /** Set when this topic belongs to a unit; undefined = the topic IS a unit. */
  parentId?: string;
  name: string;
  status: StudyTopicStatus;
  lastRevisedAt?: string;
  createdAt: string;
}

export interface StudySession {
  id: string;
  subjectId: string;
  topicId?: string;
  type: "study" | "revision";
  date: string;
  durationMinutes: number;
  notes?: string;
  createdAt: string;
}
