import type { AppState } from "@/services/app-store";
import type { StudySubject, StudyTopic } from "@/types";

/** Mastered topics / total leaf topics. Units don't count toward progress. */
export function subjectProgress(
  topics: StudyTopic[],
  subjectId: string
): number {
  const leaves = topics.filter((t) => t.subjectId === subjectId && t.parentId);
  if (leaves.length === 0) return 0;
  const mastered = leaves.filter((t) => t.status === "mastered").length;
  return Math.round((mastered / leaves.length) * 100);
}

export function subjectStats(state: AppState, subject: StudySubject, nowMs: number) {
  const topics = state.studyTopics.filter((t) => t.subjectId === subject.id);
  const units = topics.filter((t) => !t.parentId);
  const leaves = topics.filter((t) => t.parentId);
  const sessions = state.studySessions.filter(
    (s) => s.subjectId === subject.id
  );
  const totalMinutes = sessions.reduce((sum, s) => sum + s.durationMinutes, 0);
  const lastSession = [...sessions].sort((a, b) =>
    b.date.localeCompare(a.date)
  )[0];
  const dueRevision = leaves.filter(
    (t) =>
      t.status !== "mastered" &&
      (!t.lastRevisedAt ||
        new Date(t.lastRevisedAt).getTime() < nowMs - 7 * 86400000)
  );
  return {
    units,
    topics: leaves,
    mastered: leaves.filter((t) => t.status === "mastered").length,
    learning: leaves.filter((t) => t.status === "learning").length,
    sessions,
    totalMinutes,
    lastSession,
    dueRevision,
    progress:
      leaves.length > 0
        ? Math.round(
            (leaves.filter((t) => t.status === "mastered").length /
              leaves.length) *
              100
          )
        : 0,
  };
}
