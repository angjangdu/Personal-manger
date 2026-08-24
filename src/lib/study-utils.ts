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

export function unitProgress(topics: StudyTopic[], unitId: string): number {
  const leaves = topics.filter((t) => t.parentId === unitId);
  if (leaves.length === 0) return 0;
  return Math.round(
    (leaves.filter((t) => t.status === "mastered").length / leaves.length) * 100
  );
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

/** Study report (review §14): hours per subject, top topic, topics completed. */
export function studyReport(state: AppState, nowMs: number) {
  void nowMs;
  const perSubject: {
    subjectId: string;
    name: string;
    color?: string;
    minutes: number;
  }[] = [];
  let topicsCompleted = 0;
  const topicMinutes = new Map<string, number>();

  for (const subject of state.studySubjects) {
    const minutes =
      state.studySessions
        .filter((s) => s.subjectId === subject.id)
        .reduce((sum, s) => sum + s.durationMinutes, 0) +
      state.activities
        .filter((a) => a.studySubjectId === subject.id)
        .reduce((sum, a) => sum + (a.durationMinutes ?? 0), 0);
    if (minutes > 0 || !subject.archived) {
      perSubject.push({
        subjectId: subject.id,
        name: subject.name,
        color: subject.color,
        minutes,
      });
    }
    topicsCompleted += state.studyTopics.filter(
      (t) => t.subjectId === subject.id && t.parentId && t.status === "mastered"
    ).length;
  }

  for (const session of state.studySessions) {
    if (!session.topicId) continue;
    topicMinutes.set(
      session.topicId,
      (topicMinutes.get(session.topicId) ?? 0) + session.durationMinutes
    );
  }
  for (const activity of state.activities) {
    if (!activity.studyTopicId) continue;
    topicMinutes.set(
      activity.studyTopicId,
      (topicMinutes.get(activity.studyTopicId) ?? 0) +
        (activity.durationMinutes ?? 0)
    );
  }

  let topTopic: { name: string; minutes: number } | null = null;
  for (const [topicId, minutes] of topicMinutes) {
    const topic = state.studyTopics.find((t) => t.id === topicId);
    if (!topic) continue;
    if (!topTopic || minutes > topTopic.minutes) {
      topTopic = { name: topic.name, minutes };
    }
  }

  const totalMinutes = perSubject.reduce((sum, s) => sum + s.minutes, 0);
  return {
    perSubject: perSubject.sort((a, b) => b.minutes - a.minutes),
    totalMinutes,
    topicsCompleted,
    topTopic,
  };
}
