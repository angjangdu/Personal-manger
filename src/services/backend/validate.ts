import type { SyncPayload } from "@/services/backend/sync-types";

/**
 * Coarse server-side validation for the sync payload (Phase 24).
 * The mappers whitelist fields; this enforces shape/size/type sanity so a
 * malicious or buggy client cannot push arbitrary garbage to Postgres.
 */

const MAX_BODY_CHARS = 10 * 1024 * 1024; // 10 MB of JSON
const MAX_ROWS_PER_ENTITY = 5_000;
const MAX_STRING = 100_000; // note bodies
const MAX_ID = 64;
const MAX_ARRAY = 500;

const ID_RE = /^[A-Za-z0-9_-]{1,64}$/;
const DATE_KEY_RE = /^\d{4}-\d{2}-\d{2}$/;

export interface ValidationResult {
  ok: boolean;
  error?: string;
}

function checkRow(entity: string, index: number, row: unknown): string | null {
  if (typeof row !== "object" || row === null || Array.isArray(row)) {
    return `${entity}[${index}] must be an object`;
  }
  for (const [key, value] of Object.entries(row as Record<string, unknown>)) {
    if (!/^[a-z][a-zA-Z0-9_]{0,63}$/.test(key)) {
      return `${entity}[${index}]: invalid field name "${key}"`;
    }
    if (typeof value === "string") {
      const limit = key === "content" ? MAX_STRING : 5_000;
      if (value.length > limit) {
        return `${entity}[${index}].${key} exceeds ${limit} chars`;
      }
    }
    if (typeof value === "number" && !Number.isFinite(value)) {
      return `${entity}[${index}].${key} must be finite`;
    }
  }
  const id = (row as { id?: unknown }).id;
  if (typeof id !== "string" || !ID_RE.test(id)) {
    return `${entity}[${index}].id must be a 1-64 char [A-Za-z0-9_-] string`;
  }
  return null;
}

function checkArray(entity: keyof SyncPayload, value: unknown): string | null {
  if (!Array.isArray(value)) return `${entity} must be an array`;
  if (value.length > MAX_ROWS_PER_ENTITY) {
    return `${entity} exceeds ${MAX_ROWS_PER_ENTITY} rows`;
  }
  for (let i = 0; i < value.length; i++) {
    const err = checkRow(entity, i, value[i]);
    if (err) return err;
  }
  return null;
}

function checkOverrides(value: unknown): string | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return "occurrenceOverrides must be an object";
  }
  const entries = Object.entries(value as Record<string, unknown>);
  if (entries.length > MAX_ROWS_PER_ENTITY) return "occurrenceOverrides too large";
  for (const [templateId, byDate] of entries) {
    if (!ID_RE.test(templateId)) return `occurrenceOverrides: bad template id`;
    if (typeof byDate !== "object" || byDate === null) {
      return `occurrenceOverrides[${templateId}] must be an object`;
    }
    for (const [dateKey, override] of Object.entries(byDate as Record<string, unknown>)) {
      if (!DATE_KEY_RE.test(dateKey)) return `occurrenceOverrides: bad date key "${dateKey}"`;
      if (typeof override !== "object" || override === null) {
        return `occurrenceOverrides[${templateId}][${dateKey}] must be an object`;
      }
      const o = override as { done?: unknown; skipped?: unknown; completedAt?: unknown };
      if (o.done !== undefined && typeof o.done !== "boolean") return "override.done must be boolean";
      if (o.skipped !== undefined && typeof o.skipped !== "boolean") return "override.skipped must be boolean";
      if (o.completedAt !== undefined && typeof o.completedAt !== "string") return "override.completedAt must be string";
    }
  }
  return null;
}

export function validateSyncPayload(payload: unknown): ValidationResult {
  if (typeof payload !== "object" || payload === null || Array.isArray(payload)) {
    return { ok: false, error: "Payload must be an object" };
  }
  const size = JSON.stringify(payload).length;
  if (size > MAX_BODY_CHARS) {
    return { ok: false, error: `Payload exceeds ${MAX_BODY_CHARS / (1024 * 1024)} MB` };
  }

  const known = new Set([
    "tags", "projects", "goals", "tasks", "calendarEvents", "habits",
    "habitLogs", "habitGraceLogs", "activities", "studySubjects",
    "studyTopics", "studySessions", "notes", "dailyReviews",
    "rescheduleLogs", "attachments", "occurrenceOverrides",
  ]);
  for (const key of Object.keys(payload as Record<string, unknown>)) {
    if (!known.has(key)) return { ok: false, error: `Unknown entity "${key}"` };
  }

  const p = payload as SyncPayload;
  const arrayEntities: (keyof SyncPayload)[] = [
    "tags", "projects", "goals", "tasks", "calendarEvents", "habits",
    "habitLogs", "habitGraceLogs", "activities", "studySubjects",
    "studyTopics", "studySessions", "notes", "dailyReviews",
    "rescheduleLogs", "attachments",
  ];
  for (const entity of arrayEntities) {
    const err = checkArray(entity, p[entity]);
    if (err) return { ok: false, error: err };
  }
  const overrideErr = checkOverrides(p.occurrenceOverrides);
  if (overrideErr) return { ok: false, error: overrideErr };

  return { ok: true };
}
