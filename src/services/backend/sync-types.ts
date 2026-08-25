import type {
  Activity,
  Attachment,
  CalendarEvent,
  DailyReview,
  Goal,
  Habit,
  HabitGraceLog,
  HabitLog,
  Note,
  Project,
  RescheduleLog,
  StudySession,
  StudySubject,
  StudyTopic,
  Tag,
  Task,
} from "@/types";

/** Full-state sync payload (camelCase domain shape, mirroring AppState). */
export interface SyncPayload {
  tags: Tag[];
  projects: Project[];
  goals: Goal[];
  tasks: Task[];
  calendarEvents: CalendarEvent[];
  habits: Habit[];
  habitLogs: HabitLog[];
  habitGraceLogs: HabitGraceLog[];
  activities: Activity[];
  studySubjects: StudySubject[];
  studyTopics: StudyTopic[];
  studySessions: StudySession[];
  notes: Note[];
  dailyReviews: DailyReview[];
  rescheduleLogs: RescheduleLog[];
  attachments: Attachment[];
  occurrenceOverrides: Record<string, Record<string, { done?: boolean; skipped?: boolean; completedAt?: string }>>;
}

export const SYNC_ENTITIES = Object.keys({
  tags: 0, projects: 0, goals: 0, tasks: 0, calendarEvents: 0, habits: 0,
  habitLogs: 0, habitGraceLogs: 0, activities: 0, studySubjects: 0,
  studyTopics: 0, studySessions: 0, notes: 0, dailyReviews: 0,
  rescheduleLogs: 0, attachments: 0,
} satisfies Record<keyof Omit<SyncPayload, "occurrenceOverrides">, 0>) as (keyof Omit<SyncPayload, "occurrenceOverrides">)[];

export function emptySyncPayload(): SyncPayload {
  return {
    tags: [], projects: [], goals: [], tasks: [], calendarEvents: [], habits: [],
    habitLogs: [], habitGraceLogs: [], activities: [], studySubjects: [],
    studyTopics: [], studySessions: [], notes: [], dailyReviews: [],
    rescheduleLogs: [], attachments: [], occurrenceOverrides: {},
  };
}
