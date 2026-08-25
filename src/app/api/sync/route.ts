import { NextResponse } from "next/server";
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { getSupabaseServerClient } from "@/lib/supabase/client";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { validateSyncPayload } from "@/services/backend/validate";
import {
  activityFromRow, activityToRow, attachmentFromRow, attachmentToRow,
  eventFromRow, eventToRow, goalFromRow, goalToRow, graceFromRow, graceToRow,
  habitFromRow, habitLogFromRow, habitLogToRow, habitToRow, milestoneFromRow,
  milestoneToRow, noteFromRow, noteToRow, overrideFromRow, overrideToRow,
  projectFromRow, projectToRow, rescheduleFromRow, rescheduleToRow,
  reviewFromRow, reviewToRow, sessionFromRow, sessionToRow, subjectFromRow,
  subjectToRow, subtaskFromRow, subtaskToRow, tagFromRow, tagToRow,
  taskFromRow, taskToRow, toUuid, topicFromRow, topicToRow,
} from "@/services/backend/mappers";
import {
  emptySyncPayload,
  type SyncPayload,
} from "@/services/backend/sync-types";

export const dynamic = "force-dynamic";

/**
 * Whole-store sync endpoint (Phase 22/23).
 *   GET  → full domain snapshot from Postgres
 *   POST → upsert everything in the payload, delete rows missing from it
 *
 * Guarded by SYNC_SECRET. Transitional single-user design: rows are owned by
 * a stable "local owner" auth user created server-side; RLS applies to that
 * user once Auth ships. Service-role key is required server-side.
 */

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

/** Constant-time comparison (length leak avoided via hashing). */
function secretMatches(candidate: string | null): boolean {
  const secret = process.env.SYNC_SECRET;
  if (!secret || candidate === null) return false;
  const a = createHash("sha256").update(candidate).digest();
  const b = createHash("sha256").update(secret).digest();
  return timingSafeEqual(a, b);
}

function checkSecret(request: Request): boolean {
  return secretMatches(request.headers.get("x-sync-secret"));
}

async function ensureOwnerId(sb: NonNullable<ReturnType<typeof getSupabaseServerClient>>): Promise<string> {
  const email = process.env.OWNER_EMAIL ?? "owner@personal-os.local";
  const { data, error } = await sb.auth.admin.listUsers();
  if (!error) {
    const existing = data.users.find((u) => u.email?.toLowerCase() === email);
    if (existing) return existing.id;
  }
  const { data: created, error: createError } = await sb.auth.admin.createUser({
    email,
    email_confirm: true,
    password: randomBytes(24).toString("base64url"),
  });
  if (createError || !created.user) {
    throw new Error(`Could not ensure owner user: ${createError?.message ?? "no user"}`);
  }
  return created.user.id;
}

export async function GET(request: Request) {
  const ip = clientIp(request);
  if (!rateLimit(`sync:${ip}`)) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: { "retry-after": "60" } }
    );
  }
  if (!checkSecret(request)) return unauthorized();
  const sb = getSupabaseServerClient();
  if (!sb) return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });

  try {
    const [
      tags, projects, goals, tasks, subtasks, milestones, overrides,
      events, habits, habitLogs, graceLogs, activities, subjects, topics,
      sessions, notes, reviews, reschedules, attachments,
    ] = await Promise.all([
      sb.from("tags").select("*"),
      sb.from("projects").select("*"),
      sb.from("goals").select("*"),
      sb.from("tasks").select("*"),
      sb.from("subtasks").select("*"),
      sb.from("milestones").select("*"),
      sb.from("occurrence_overrides").select("*"),
      sb.from("calendar_events").select("*"),
      sb.from("habits").select("*"),
      sb.from("habit_logs").select("*"),
      sb.from("habit_grace_logs").select("*"),
      sb.from("activities").select("*"),
      sb.from("study_subjects").select("*"),
      sb.from("study_topics").select("*"),
      sb.from("study_sessions").select("*"),
      sb.from("notes").select("*"),
      sb.from("daily_reviews").select("*"),
      sb.from("reschedule_logs").select("*"),
      sb.from("attachments").select("*"),
    ]);

    const firstError = [tags, projects, goals, tasks, subtasks, milestones, overrides, events, habits, habitLogs, graceLogs, activities, subjects, topics, sessions, notes, reviews, reschedules, attachments]
      .find((r) => r.error)?.error;
    if (firstError) throw new Error(firstError.message);

    const payload = emptySyncPayload();
    payload.tags = (tags.data ?? []).map(tagFromRow);
    payload.projects = (projects.data ?? []).map(projectFromRow);
    payload.goals = (goals.data ?? []).map((row) =>
      goalFromRow(row, (milestones.data ?? []).filter((m) => m.goal_id === row.id).map(milestoneFromRow))
    );
    payload.tasks = (tasks.data ?? []).map((row) =>
      taskFromRow(row, (subtasks.data ?? []).filter((st) => st.task_id === row.id).map(subtaskFromRow))
    );
    payload.occurrenceOverrides = {};
    for (const row of overrides.data ?? []) {
      const o = overrideFromRow(row);
      (payload.occurrenceOverrides[row.template_task_id] ??= {})[row.date_key] = o;
    }
    payload.calendarEvents = (events.data ?? []).map(eventFromRow);
    payload.habits = (habits.data ?? []).map(habitFromRow);
    payload.habitLogs = (habitLogs.data ?? []).map(habitLogFromRow);
    payload.habitGraceLogs = (graceLogs.data ?? []).map(graceFromRow);
    payload.activities = (activities.data ?? []).map(activityFromRow);
    payload.studySubjects = (subjects.data ?? []).map(subjectFromRow);
    payload.studyTopics = (topics.data ?? []).map(topicFromRow);
    payload.studySessions = (sessions.data ?? []).map(sessionFromRow);
    payload.notes = (notes.data ?? []).map(noteFromRow);
    payload.dailyReviews = (reviews.data ?? []).map(reviewFromRow);
    payload.rescheduleLogs = (reschedules.data ?? []).map(rescheduleFromRow);
    payload.attachments = (attachments.data ?? []).map(attachmentFromRow);

    return NextResponse.json(payload);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const ip = clientIp(request);
  if (!rateLimit(`sync:${ip}`)) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: { "retry-after": "60" } }
    );
  }
  if (!checkSecret(request)) return unauthorized();
  const sb = getSupabaseServerClient();
  if (!sb) return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const validation = validateSyncPayload(raw);
  if (!validation.ok) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }
  const payload = raw as SyncPayload;

  try {
    const ownerId = await ensureOwnerId(sb);
    const counts: Record<string, number> = {};
    const db = sb;

    /** Upsert rows, then delete rows whose ids vanished from the payload.
     *  Child tables without their own user_id column (subtasks) diff within
     *  a scope column instead. */
    async function syncTable(
      table: string,
      rows: Record<string, unknown>[],
      idKey = "id",
      scope?: { column: string; ids: string[] }
    ) {
      if (rows.length > 0) {
        const { error } = await db.from(table).upsert(rows);
        if (error) throw new Error(`${table}: ${error.message}`);
      }
      let existing: Array<Record<string, unknown>> = [];
      if (scope) {
        if (scope.ids.length === 0) {
          counts[table] = 0;
          return;
        }
        const { data, error } = await db
          .from(table)
          .select(`${idKey}, ${scope.column}`)
          .in(scope.column, scope.ids);
        if (error) throw new Error(`${table}: ${error.message}`);
        existing = (data ?? []) as unknown as Array<Record<string, unknown>>;
      } else {
        const { data, error } = await db
          .from(table)
          .select(idKey)
          .eq("user_id", ownerId);
        if (error) throw new Error(`${table}: ${error.message}`);
        existing = (data ?? []) as unknown as Array<Record<string, unknown>>;
      }
      const keep = new Set(rows.map((r) => String(r[idKey])));
      const toDelete = existing
        .map((r) => String(r[idKey]))
        .filter((id) => !keep.has(id));
      if (toDelete.length > 0) {
        const { error: delError } = await db.from(table).delete().in(idKey, toDelete);
        if (delError) throw new Error(`${table} delete: ${delError.message}`);
      }
      counts[table] = rows.length;
    }

    await syncTable("tags", payload.tags.map((t) => tagToRow(t, ownerId)));
    await syncTable("goals", payload.goals.map((g) => goalToRow(g, ownerId)));

    const milestoneRows = payload.goals.flatMap((g) =>
      g.milestones.map((m) => milestoneToRow(m, ownerId))
    );
    await syncTable("milestones", milestoneRows);

    await syncTable("projects", payload.projects.map((p) => projectToRow(p, ownerId)));
    await syncTable("tasks", payload.tasks.map((t) => taskToRow(t, ownerId)));

    const subtaskRows = payload.tasks.flatMap((t) =>
      t.subtasks.map((st) => subtaskToRow(st))
    );
    await syncTable("subtasks", subtaskRows, "id", {
      column: "task_id",
      ids: payload.tasks.map((t) => toUuid(t.id)),
    });

    // Occurrence overrides: composite key (template_task_id, date_key).
    const overrideRows = Object.entries(payload.occurrenceOverrides ?? {}).flatMap(
      ([templateId, byDate]) =>
        Object.entries(byDate ?? {}).map(([dateKey, o]) =>
          overrideToRow(templateId, dateKey, o, ownerId)
        )
    );
    if (overrideRows.length > 0) {
      const { error } = await sb
        .from("occurrence_overrides")
        .upsert(overrideRows, { onConflict: "template_task_id,date_key" });
      if (error) throw new Error(`occurrence_overrides: ${error.message}`);
    }
    const { data: existingOverrides } = await sb
      .from("occurrence_overrides")
      .select("template_task_id, date_key")
      .eq("user_id", ownerId);
    const keepPairs = new Set(overrideRows.map((r) => `${r.template_task_id}|${r.date_key}`));
    const stalePairs = (existingOverrides ?? [])
      .map((r) => `${r.template_task_id}|${r.date_key}`)
      .filter((pair) => !keepPairs.has(pair));
    if (stalePairs.length > 0) {
      // Per-pair delete — a bulk template-id delete would nuke kept siblings.
      for (const pair of stalePairs) {
        const [templateId, dateKey] = pair.split("|");
        await sb
          .from("occurrence_overrides")
          .delete()
          .eq("template_task_id", templateId)
          .eq("date_key", dateKey);
      }
    }
    counts["occurrence_overrides"] = overrideRows.length;

    await syncTable("calendar_events", payload.calendarEvents.map((e) => eventToRow(e, ownerId)));
    await syncTable("habits", payload.habits.map((h) => habitToRow(h, ownerId)));
    await syncTable("habit_logs", payload.habitLogs.map((l) => habitLogToRow(l, ownerId)));
    await syncTable("habit_grace_logs", payload.habitGraceLogs.map((g) => graceToRow(g, ownerId)));
    await syncTable("activities", payload.activities.map((a) => activityToRow(a, ownerId)));
    await syncTable("study_subjects", payload.studySubjects.map((s) => subjectToRow(s, ownerId)));
    await syncTable("study_topics", payload.studyTopics.map((t) => topicToRow(t, ownerId)));
    await syncTable("study_sessions", payload.studySessions.map((s) => sessionToRow(s, ownerId)));
    await syncTable("notes", payload.notes.map((n) => noteToRow(n, ownerId)));
    await syncTable("daily_reviews", payload.dailyReviews.map((r) => reviewToRow(r, ownerId)));
    await syncTable("reschedule_logs", payload.rescheduleLogs.map((r) => rescheduleToRow(r, ownerId)));
    await syncTable("attachments", payload.attachments.map((a) => attachmentToRow(a, ownerId)));

    return NextResponse.json({ ok: true, counts });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
