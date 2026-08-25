import type { Task } from "@/types";

/**
 * Row ↔ domain mapping for `tasks` — the reference pattern every entity
 * adapter follows in Phase 23 (Backend Integration):
 *   1. snake_case row type mirroring the SQL table
 *   2. toDomain / toRow mappers
 *   3. thin CRUD over the Supabase client, throwing on error
 */

export interface TaskRow {
  id: string;
  user_id: string | null;
  title: string;
  description: string | null;
  status: Task["status"];
  priority: Task["priority"];
  due_date: string | null;
  due_time: string | null;
  estimated_duration_minutes: number | null;
  project_id: string | null;
  goal_id: string | null;
  tag_ids: string[];
  repeat: Task["repeat"] | null;
  mit: boolean;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export function taskToDomain(row: TaskRow): Task {
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? undefined,
    status: row.status,
    priority: row.priority,
    dueDate: row.due_date ?? undefined,
    dueTime: row.due_time ?? undefined,
    estimatedDurationMinutes: row.estimated_duration_minutes ?? undefined,
    projectId: row.project_id ?? undefined,
    goalId: row.goal_id ?? undefined,
    tagIds: row.tag_ids ?? [],
    repeat: row.repeat ?? undefined,
    mit: row.mit,
    completedAt: row.completed_at ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    subtasks: [], // hydrated separately from the subtasks table
  };
}

export function taskToRow(
  task: Omit<Task, "subtasks">,
  userId: string
): Omit<TaskRow, "user_id"> & { user_id: string } {
  return {
    id: task.id,
    user_id: userId,
    title: task.title,
    description: task.description ?? null,
    status: task.status,
    priority: task.priority,
    due_date: task.dueDate ?? null,
    due_time: task.dueTime ?? null,
    estimated_duration_minutes: task.estimatedDurationMinutes ?? null,
    project_id: task.projectId ?? null,
    goal_id: task.goalId ?? null,
    tag_ids: task.tagIds,
    repeat: task.repeat ?? null,
    mit: task.mit ?? false,
    completed_at: task.completedAt ?? null,
    created_at: task.createdAt,
    updated_at: task.updatedAt,
  };
}

/**
 * Phase-23 shape (implemented per entity once credentials exist):
 *
 * export const tasksAdapter = {
 *   async list(userId): Promise<Task[]> { … },
 *   async upsert(task, userId) { … },
 *   async delete(id) { … },
 * };
 */
