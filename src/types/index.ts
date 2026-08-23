/**
 * Core domain types — derived from Personal OS SRS v2.0 (Section 6: Data Requirements).
 * These types are the single source of truth shared by UI, services, and future backend.
 */

export type TaskStatus = "inbox" | "planned" | "in_progress" | "completed" | "cancelled";

export type Priority = "low" | "medium" | "high" | "urgent";

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
  actualDurationMinutes?: number;
  projectId?: string;
  goalId?: string;
  tagIds: string[];
  subtasks: Subtask[];
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  color?: string;
  goalId?: string;
  deadline?: string;
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

export interface Activity {
  id: string;
  title: string;
  taskId?: string;
  projectId?: string;
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

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startAt: string;
  endAt: string;
  allDay: boolean;
  taskId?: string;
  activityId?: string;
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
