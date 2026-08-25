import type { AppState } from "@/services/app-store";
import { selectVisibleTasks } from "@/lib/selectors";
import { expandEvents } from "@/lib/recurrence";
import { startOfDay } from "@/lib/date-utils";

export interface SearchResult {
  id: string;
  kind: "Task" | "Project" | "Goal" | "Habit" | "Note" | "Subject" | "Topic" | "Event";
  title: string;
  subtitle?: string;
  href: string;
}

const KIND_ORDER: SearchResult["kind"][] = [
  "Task",
  "Event",
  "Project",
  "Goal",
  "Note",
  "Subject",
  "Topic",
  "Habit",
];

/** Cross-entity search (review §17). Pure — query matched case-insensitively. */
export function globalSearch(
  state: AppState,
  query: string,
  nowMs: number,
  limitPerKind = 3
): SearchResult[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const buckets = new Map<SearchResult["kind"], SearchResult[]>();

  const push = (result: SearchResult) => {
    const list = buckets.get(result.kind) ?? [];
    if (list.length >= limitPerKind) return;
    list.push(result);
    buckets.set(result.kind, list);
  };

  const match = (...fields: (string | undefined)[]) =>
    fields.some((f) => f?.toLowerCase().includes(q));

  for (const task of selectVisibleTasks(state, nowMs)) {
    if (match(task.title, task.description)) {
      push({
        id: `task-${task.id}`,
        kind: "Task",
        title: task.title,
        subtitle: [task.priority, task.dueDate ? `due ${new Date(task.dueDate).toLocaleDateString()}` : null]
          .filter(Boolean)
          .join(" · "),
        href: "/tasks",
      });
    }
  }

  for (const event of expandEvents(
    state.calendarEvents,
    nowMs,
    startOfDay(new Date(nowMs)).getTime()
  )) {
    if (match(event.title)) {
      push({
        id: `event-${event.id}`,
        kind: "Event",
        title: event.title,
        subtitle: new Date(event.startAt).toLocaleString(undefined, {
          month: "short",
          day: "numeric",
          hour: "2-digit", hour12: false,
          minute: "2-digit",
        }),
        href: "/calendar",
      });
      break; // recurring events expand to many — one hit is enough
    }
  }

  for (const project of state.projects) {
    if (match(project.name, project.description)) {
      push({
        id: `project-${project.id}`,
        kind: "Project",
        title: project.name,
        subtitle: project.description,
        href: `/projects/${project.id}`,
      });
    }
  }

  for (const goal of state.goals) {
    if (match(goal.title, goal.description)) {
      push({
        id: `goal-${goal.id}`,
        kind: "Goal",
        title: goal.title,
        subtitle: goal.category,
        href: `/goals/${goal.id}`,
      });
    }
  }

  for (const habit of state.habits) {
    if (match(habit.name, habit.description)) {
      push({
        id: `habit-${habit.id}`,
        kind: "Habit",
        title: habit.name,
        href: "/habits",
      });
    }
  }

  for (const note of state.notes) {
    if (match(note.title, note.content)) {
      const snippetIndex = note.content.toLowerCase().indexOf(q);
      const snippet =
        note.title.toLowerCase().includes(q) || snippetIndex === -1
          ? note.folder
          : note.content.slice(Math.max(0, snippetIndex - 20), snippetIndex + 40).trim();
      push({
        id: `note-${note.id}`,
        kind: "Note",
        title: note.title,
        subtitle: snippet,
        href: "/notes",
      });
    }
  }

  for (const subject of state.studySubjects) {
    if (match(subject.name, subject.description)) {
      push({
        id: `subject-${subject.id}`,
        kind: "Subject",
        title: subject.name,
        href: `/study/${subject.id}`,
      });
    }
  }

  for (const topic of state.studyTopics) {
    if (topic.parentId && match(topic.name)) {
      push({
        id: `topic-${topic.id}`,
        kind: "Topic",
        title: topic.name,
        subtitle:
          state.studySubjects.find((s) => s.id === topic.subjectId)?.name,
        href: `/study/${topic.subjectId}`,
      });
    }
  }

  // Interleave by kind priority so mixed queries surface variety.
  const out: SearchResult[] = [];
  let added = true;
  while (out.length < limitPerKind * KIND_ORDER.length && added) {
    added = false;
    for (const kind of KIND_ORDER) {
      const list = buckets.get(kind);
      if (list && list.length > 0) {
        out.push(list.shift()!);
        added = true;
        if (out.length >= limitPerKind * KIND_ORDER.length) break;
      }
    }
  }
  return out;
}
