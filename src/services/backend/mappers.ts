import { createHash } from "node:crypto";
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
  RescheduleLog,
  StudySession,
  StudySubject,
  StudyTopic,
  Subtask,
  Tag,
  Task,
} from "@/types";

/**
 * Row ↔ domain mappers for every entity (Phase 22/23).
 *
 * Seed/demo ids are slugs ("task-1", tag "study"), while Postgres id columns
 * are uuid. toUuid() converts any id deterministically (same input → same
 * uuid), and is applied to primary keys AND every reference field so foreign
 * keys always resolve. After the first pull the client store holds real
 * uuids everywhere.
 */

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Deterministic slug→uuid (md5, version-8 formatted). */
export function toUuid(id: string): string {
  if (UUID_RE.test(id)) return id.toLowerCase();
  const hex = createHash("md5").update(id).digest("hex");
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    "8" + hex.slice(13, 16),
    ((parseInt(hex.slice(16, 18), 16) & 0x3f) | 0x80).toString(16).padStart(2, "0") + hex.slice(18, 20),
    hex.slice(20, 32),
  ].join("-");
}

const U = toUuid;
const uuidArray = (ids: string[] | undefined): string[] => (ids ?? []).map(U);

const s = <T,>(v: T | undefined): T | null => (v === undefined ? null : v);
const u = <T,>(v: T | null | undefined): T | undefined => (v === undefined || v === null ? undefined : v);

// ── Tags ────────────────────────────────────────────────────────────────
export type TagRow = { id: string; user_id: string | null; name: string; color: string | null };
export const tagToRow = (t: Tag, userId: string): TagRow => ({ id: U(t.id), user_id: userId, name: t.name, color: s(t.color) });
export const tagFromRow = (r: TagRow): Tag => ({ id: r.id, name: r.name, color: u(r.color) });

// ── Projects ────────────────────────────────────────────────────────────
export type ProjectRow = {
  id: string; user_id: string | null; name: string; description: string | null;
  color: string | null; goal_id: string | null; deadline: string | null;
  status: Project["status"] | null; archived: boolean;
  created_at: string; updated_at: string;
};
export const projectToRow = (p: Project, userId: string): ProjectRow => ({
  id: U(p.id), user_id: userId, name: p.name, description: s(p.description),
  color: s(p.color), goal_id: p.goalId ? U(p.goalId) : null, deadline: s(p.deadline),
  status: p.status ?? "active", archived: p.archived, created_at: p.createdAt, updated_at: p.updatedAt,
});
export const projectFromRow = (r: ProjectRow): Project => ({
  id: r.id, name: r.name, description: u(r.description), color: u(r.color),
  goalId: u(r.goal_id), deadline: u(r.deadline), status: u(r.status) ?? "active",
  archived: r.archived, createdAt: r.created_at, updatedAt: r.updated_at,
});

// ── Goals (+ milestones as children) ────────────────────────────────────
export type GoalRow = {
  id: string; user_id: string | null; title: string; description: string | null;
  category: string | null; deadline: string | null; archived: boolean;
  created_at: string; updated_at: string;
};
export const goalToRow = (g: Goal, userId: string): GoalRow => ({
  id: U(g.id), user_id: userId, title: g.title, description: s(g.description),
  category: s(g.category), deadline: s(g.deadline), archived: g.archived,
  created_at: g.createdAt, updated_at: g.updatedAt,
});
export const goalFromRow = (r: GoalRow, milestones: Milestone[] = []): Goal => ({
  id: r.id, title: r.title, description: u(r.description), category: u(r.category),
  deadline: u(r.deadline), milestones, projectIds: [], progressPercent: 0,
  archived: r.archived, createdAt: r.created_at, updatedAt: r.updated_at,
});

export type MilestoneRow = {
  id: string; goal_id: string; user_id: string | null; title: string;
  target_date: string | null; completed_at: string | null; created_at: string;
};
export const milestoneToRow = (m: Milestone, userId: string): MilestoneRow => ({
  id: U(m.id), goal_id: U(m.goalId), user_id: userId, title: m.title,
  target_date: s(m.targetDate), completed_at: s(m.completedAt), created_at: m.createdAt,
});
export const milestoneFromRow = (r: MilestoneRow): Milestone => ({
  id: r.id, goalId: r.goal_id, title: r.title, targetDate: u(r.target_date),
  completedAt: u(r.completed_at), createdAt: r.created_at,
});

// ── Tasks (+ subtasks as children) ──────────────────────────────────────
export type TaskRow = {
  id: string; user_id: string | null; title: string; description: string | null;
  status: Task["status"]; priority: Task["priority"]; due_date: string | null;
  due_time: string | null; estimated_duration_minutes: number | null;
  project_id: string | null; goal_id: string | null; tag_ids: string[];
  repeat: Task["repeat"] | null; mit: boolean; completed_at: string | null;
  created_at: string; updated_at: string;
};
export const taskToRow = (t: Task, userId: string): TaskRow => ({
  id: U(t.id), user_id: userId, title: t.title, description: s(t.description),
  status: t.status, priority: t.priority, due_date: s(t.dueDate), due_time: s(t.dueTime),
  estimated_duration_minutes: s(t.estimatedDurationMinutes),
  project_id: t.projectId ? U(t.projectId) : null,
  goal_id: t.goalId ? U(t.goalId) : null,
  tag_ids: uuidArray(t.tagIds), repeat: s(t.repeat), mit: t.mit ?? false,
  completed_at: s(t.completedAt), created_at: t.createdAt, updated_at: t.updatedAt,
});
export const taskFromRow = (r: TaskRow, subtasks: Subtask[] = []): Task => ({
  id: r.id, title: r.title, description: u(r.description), status: r.status,
  priority: r.priority, dueDate: u(r.due_date), dueTime: u(r.due_time),
  estimatedDurationMinutes: u(r.estimated_duration_minutes), projectId: u(r.project_id),
  goalId: u(r.goal_id), tagIds: r.tag_ids ?? [], repeat: u(r.repeat), mit: r.mit,
  completedAt: u(r.completed_at), createdAt: r.created_at, updatedAt: r.updated_at,
  subtasks,
});

export type SubtaskRow = {
  id: string; task_id: string; title: string;
  completed: boolean; position: number; created_at: string;
};
/** No user_id column — ownership inherits through the parent task. */
export const subtaskToRow = (st: Subtask): SubtaskRow => ({
  id: U(st.id), task_id: U(st.taskId), title: st.title,
  completed: st.completed, position: st.order, created_at: st.createdAt,
});
export const subtaskFromRow = (r: SubtaskRow): Subtask => ({
  id: r.id, taskId: r.task_id, title: r.title, completed: r.completed,
  order: r.position, createdAt: r.created_at,
});

// ── Occurrence overrides ────────────────────────────────────────────────
export type OverrideRow = {
  template_task_id: string; user_id: string | null; date_key: string;
  done: boolean; skipped: boolean; completed_at: string | null;
};
export const overrideToRow = (templateId: string, dateKey: string, o: OccurrenceOverride, userId: string): OverrideRow => ({
  template_task_id: U(templateId), user_id: userId, date_key: dateKey,
  done: o.done ?? false, skipped: o.skipped ?? false, completed_at: s(o.completedAt),
});
export const overrideFromRow = (r: OverrideRow): OccurrenceOverride => ({
  done: r.done || undefined, skipped: r.skipped || undefined,
  completedAt: u(r.completed_at),
});

// ── Calendar events ─────────────────────────────────────────────────────
export type EventRow = {
  id: string; user_id: string | null; title: string; description: string | null;
  start_at: string; end_at: string; all_day: boolean; task_id: string | null;
  repeat: CalendarEvent["repeat"] | null; category: CalendarEvent["category"] | null;
  created_at: string;
};
export const eventToRow = (e: CalendarEvent, userId: string): EventRow => ({
  id: U(e.id), user_id: userId, title: e.title, description: s(e.description),
  start_at: e.startAt, end_at: e.endAt, all_day: e.allDay,
  task_id: e.taskId ? U(e.taskId) : null,
  repeat: s(e.repeat), category: s(e.category) ?? "general", created_at: e.createdAt,
});
export const eventFromRow = (r: EventRow): CalendarEvent => ({
  id: r.id, title: r.title, description: u(r.description), startAt: r.start_at,
  endAt: r.end_at, allDay: r.all_day, taskId: u(r.task_id), repeat: u(r.repeat),
  category: u(r.category) ?? "general", createdAt: r.created_at,
});

// ── Habits / logs / grace ───────────────────────────────────────────────
export type HabitRow = {
  id: string; user_id: string | null; name: string; description: string | null;
  schedule: Habit["schedule"]; weekdays: number[] | null; archived: boolean; created_at: string;
};
export const habitToRow = (h: Habit, userId: string): HabitRow => ({
  id: U(h.id), user_id: userId, name: h.name, description: s(h.description),
  schedule: h.schedule, weekdays: s(h.weekdays), archived: h.archived, created_at: h.createdAt,
});
export const habitFromRow = (r: HabitRow): Habit => ({
  id: r.id, name: r.name, description: u(r.description), schedule: r.schedule,
  weekdays: u(r.weekdays), archived: r.archived, createdAt: r.created_at,
});

export type HabitLogRow = {
  id: string; user_id: string | null; habit_id: string; completed_on: string; created_at: string;
};
export const habitLogToRow = (l: HabitLog, userId: string): HabitLogRow => ({
  id: U(l.id), user_id: userId, habit_id: U(l.habitId),
  completed_on: l.completedOn.slice(0, 10), created_at: l.createdAt,
});
export const habitLogFromRow = (r: HabitLogRow): HabitLog => ({
  id: r.id, habitId: r.habit_id,
  completedOn: new Date(r.completed_on + "T00:00:00").toISOString(),
  createdAt: r.created_at,
});

export type GraceRow = {
  id: string; user_id: string | null; habit_id: string; date_key: string;
  reason: string; note: string | null; created_at: string;
};
export const graceToRow = (g: HabitGraceLog, userId: string): GraceRow => ({
  id: U(g.id), user_id: userId, habit_id: U(g.habitId), date_key: g.dateKey,
  reason: g.reason, note: s(g.note), created_at: g.createdAt,
});
export const graceFromRow = (r: GraceRow): HabitGraceLog => ({
  id: r.id, habitId: r.habit_id, dateKey: r.date_key,
  reason: r.reason as HabitGraceLog["reason"], note: u(r.note), createdAt: r.created_at,
});

// ── Activities ──────────────────────────────────────────────────────────
export type ActivityRow = {
  id: string; user_id: string | null; title: string; task_id: string | null;
  project_id: string | null; category: Activity["category"] | null;
  study_subject_id: string | null; study_topic_id: string | null;
  started_at: string; ended_at: string | null; paused_at: string | null;
  total_paused_ms: number; duration_minutes: number | null; notes: string | null;
  created_at: string;
};
export const activityToRow = (a: Activity, userId: string): ActivityRow => ({
  id: U(a.id), user_id: userId, title: a.title,
  task_id: a.taskId ? U(a.taskId) : null,
  project_id: a.projectId ? U(a.projectId) : null,
  category: s(a.category),
  study_subject_id: a.studySubjectId ? U(a.studySubjectId) : null,
  study_topic_id: a.studyTopicId ? U(a.studyTopicId) : null,
  started_at: a.startedAt, ended_at: s(a.endedAt), paused_at: s(a.pausedAt),
  total_paused_ms: a.totalPausedMs, duration_minutes: s(a.durationMinutes),
  notes: s(a.notes), created_at: a.createdAt,
});
export const activityFromRow = (r: ActivityRow): Activity => ({
  id: r.id, title: r.title, taskId: u(r.task_id), projectId: u(r.project_id),
  category: u(r.category), studySubjectId: u(r.study_subject_id),
  studyTopicId: u(r.study_topic_id), startedAt: r.started_at, endedAt: u(r.ended_at),
  pausedAt: u(r.paused_at), totalPausedMs: Number(r.total_paused_ms ?? 0),
  durationMinutes: u(r.duration_minutes), notes: u(r.notes), createdAt: r.created_at,
});

// ── Study ───────────────────────────────────────────────────────────────
export type SubjectRow = {
  id: string; user_id: string | null; name: string; description: string | null;
  color: string | null; archived: boolean; created_at: string;
};
export const subjectToRow = (s_: StudySubject, userId: string): SubjectRow => ({
  id: U(s_.id), user_id: userId, name: s_.name, description: s(s_.description),
  color: s(s_.color), archived: s_.archived, created_at: s_.createdAt,
});
export const subjectFromRow = (r: SubjectRow): StudySubject => ({
  id: r.id, name: r.name, description: u(r.description), color: u(r.color),
  archived: r.archived, createdAt: r.created_at,
});

export type TopicRow = {
  id: string; user_id: string | null; subject_id: string; parent_id: string | null;
  name: string; status: StudyTopic["status"]; last_revised_at: string | null; created_at: string;
};
export const topicToRow = (t: StudyTopic, userId: string): TopicRow => ({
  id: U(t.id), user_id: userId, subject_id: U(t.subjectId), parent_id: t.parentId ? U(t.parentId) : null,
  name: t.name, status: t.status, last_revised_at: s(t.lastRevisedAt), created_at: t.createdAt,
});
export const topicFromRow = (r: TopicRow): StudyTopic => ({
  id: r.id, subjectId: r.subject_id, parentId: u(r.parent_id), name: r.name,
  status: r.status, lastRevisedAt: u(r.last_revised_at), createdAt: r.created_at,
});

export type SessionRow = {
  id: string; user_id: string | null; subject_id: string; topic_id: string | null;
  type: StudySession["type"]; date: string; duration_minutes: number;
  notes: string | null; created_at: string;
};
export const sessionToRow = (s_: StudySession, userId: string): SessionRow => ({
  id: U(s_.id), user_id: userId, subject_id: U(s_.subjectId), topic_id: s_.topicId ? U(s_.topicId) : null,
  type: s_.type, date: s_.date, duration_minutes: s_.durationMinutes,
  notes: s(s_.notes), created_at: s_.createdAt,
});
export const sessionFromRow = (r: SessionRow): StudySession => ({
  id: r.id, subjectId: r.subject_id, topicId: u(r.topic_id), type: r.type,
  date: r.date, durationMinutes: r.duration_minutes, notes: u(r.notes), createdAt: r.created_at,
});

// ── Notes ───────────────────────────────────────────────────────────────
export type NoteRow = {
  id: string; user_id: string | null; title: string; content: string;
  folder: string | null; pinned: boolean; tag_ids: string[];
  linked_task_ids: string[]; linked_project_ids: string[];
  linked_study_topic_id: string | null; created_at: string; updated_at: string;
};
export const noteToRow = (n: Note, userId: string): NoteRow => ({
  id: U(n.id), user_id: userId, title: n.title, content: n.content,
  folder: s(n.folder), pinned: n.pinned ?? false, tag_ids: uuidArray(n.tagIds),
  linked_task_ids: uuidArray(n.linkedTaskIds),
  linked_project_ids: uuidArray(n.linkedProjectIds),
  linked_study_topic_id: n.linkedStudyTopicId ? U(n.linkedStudyTopicId) : null,
  created_at: n.createdAt, updated_at: n.updatedAt,
});
export const noteFromRow = (r: NoteRow): Note => ({
  id: r.id, title: r.title, content: r.content, folder: u(r.folder),
  pinned: r.pinned, tagIds: r.tag_ids ?? [], linkedTaskIds: r.linked_task_ids ?? [],
  linkedProjectIds: r.linked_project_ids ?? [], linkedStudyTopicId: u(r.linked_study_topic_id),
  createdAt: r.created_at, updatedAt: r.updated_at,
});

// ── Daily reviews ───────────────────────────────────────────────────────
export type ReviewRow = {
  id: string; user_id: string | null; date: string;
  tasks_completed_count: number; focus_minutes: number; study_minutes: number;
  went_well: string | null; went_wrong: string | null; to_improve: string | null;
  tomorrow_priority: string | null; created_at: string;
};
export const reviewToRow = (r: DailyReview, userId: string): ReviewRow => ({
  id: U(r.id), user_id: userId, date: r.date.slice(0, 10),
  tasks_completed_count: r.tasksCompletedCount, focus_minutes: r.focusMinutes,
  study_minutes: r.studyMinutes, went_well: s(r.wentWell), went_wrong: s(r.wentWrong),
  to_improve: s(r.toImprove), tomorrow_priority: s(r.tomorrowPriority), created_at: r.createdAt,
});
export const reviewFromRow = (r: ReviewRow): DailyReview => ({
  id: r.id, date: new Date(r.date + "T00:00:00").toISOString(),
  tasksCompletedCount: r.tasks_completed_count, focusMinutes: r.focus_minutes,
  studyMinutes: r.study_minutes, wentWell: u(r.went_well), wentWrong: u(r.went_wrong),
  toImprove: u(r.to_improve), tomorrowPriority: u(r.tomorrow_priority), createdAt: r.created_at,
});

// ── Reschedule logs ─────────────────────────────────────────────────────
export type RescheduleRow = {
  id: string; user_id: string | null; item_id: string; item_type: string;
  title: string; from_start: string; to_start: string; reason: RescheduleLog["reason"];
  note: string | null; created_at: string;
};
export const rescheduleToRow = (r: RescheduleLog, userId: string): RescheduleRow => ({
  id: U(r.id), user_id: userId, item_id: U(r.itemId), item_type: r.itemType,
  title: r.title, from_start: r.fromStart, to_start: r.toStart,
  reason: r.reason, note: s(r.note), created_at: r.createdAt,
});
export const rescheduleFromRow = (r: RescheduleRow): RescheduleLog => ({
  id: r.id, itemId: r.item_id, itemType: "event", title: r.title,
  fromStart: r.from_start, toStart: r.to_start, reason: r.reason,
  note: u(r.note), createdAt: r.created_at,
});

// ── Attachments metadata ────────────────────────────────────────────────
export type AttachmentRow = {
  id: string; user_id: string | null; name: string; ext: string; mime: string;
  size_bytes: number; kind: string; note_id: string | null; task_id: string | null;
  project_id: string | null; study_subject_id: string | null; study_topic_id: string | null;
  tag_ids: string[]; uploaded_at: string;
};
export const attachmentToRow = (a: Attachment, userId: string): AttachmentRow => ({
  id: U(a.id), user_id: userId, name: a.name, ext: a.ext, mime: a.mime,
  size_bytes: a.sizeBytes, kind: a.kind,
  note_id: a.noteId ? U(a.noteId) : null,
  task_id: a.taskId ? U(a.taskId) : null,
  project_id: a.projectId ? U(a.projectId) : null,
  study_subject_id: a.studySubjectId ? U(a.studySubjectId) : null,
  study_topic_id: a.studyTopicId ? U(a.studyTopicId) : null,
  tag_ids: uuidArray(a.tagIds), uploaded_at: a.uploadedAt,
});
export const attachmentFromRow = (r: AttachmentRow): Attachment => ({
  id: r.id, name: r.name, ext: r.ext, mime: r.mime, sizeBytes: Number(r.size_bytes ?? 0),
  kind: r.kind as Attachment["kind"], noteId: u(r.note_id), taskId: u(r.task_id),
  projectId: u(r.project_id), studySubjectId: u(r.study_subject_id),
  studyTopicId: u(r.study_topic_id), tagIds: r.tag_ids ?? [], uploadedAt: r.uploaded_at,
});
