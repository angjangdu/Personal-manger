import { DATA_SOURCE } from "@/lib/supabase/client";
import type { AppState } from "@/services/app-store";
import type { SyncPayload } from "@/services/backend/sync-types";

/**
 * Client side of whole-store sync: pull the remote snapshot on load and
 * push the local snapshot (debounced) after every mutation. Local mode and
 * offline states are no-ops.
 */

const PUSH_DEBOUNCE_MS = 2500;

export function remoteSyncEnabled(): boolean {
  // Phase 25: the session cookie authorizes the call; the shared secret
  // (if configured) remains as a script/dev fallback header.
  return DATA_SOURCE === "supabase";
}

function headers(): HeadersInit {
  return {
    "content-type": "application/json",
    "x-sync-secret": process.env.NEXT_PUBLIC_SYNC_SECRET ?? "",
  };
}

export async function pullRemote(): Promise<Partial<AppState> | null> {
  if (!remoteSyncEnabled()) return null;
  try {
    const response = await fetch("/api/sync", { headers: headers() });
    if (!response.ok) {
      console.warn("[sync] pull failed:", response.status);
      return null;
    }
    return (await response.json()) as Partial<AppState>;
  } catch (error) {
    console.warn("[sync] pull error:", error);
    return null;
  }
}

let pushTimer: ReturnType<typeof setTimeout> | null = null;
let pushing = false;
let pendingAgain = false;

export function scheduleRemotePush(getState: () => AppState): void {
  if (!remoteSyncEnabled() || typeof window === "undefined") return;
  if (pushTimer) clearTimeout(pushTimer);
  pushTimer = setTimeout(() => void pushNow(getState), PUSH_DEBOUNCE_MS);
}

async function pushNow(getState: () => AppState): Promise<void> {
  if (pushing) {
    pendingAgain = true;
    return;
  }
  pushing = true;
  try {
    const state = getState();
    // SyncPayload is AppState minus local-only fields.
    const payload: SyncPayload = {
      tags: state.tags,
      projects: state.projects,
      goals: state.goals,
      tasks: state.tasks,
      calendarEvents: state.calendarEvents,
      habits: state.habits,
      habitLogs: state.habitLogs,
      habitGraceLogs: state.habitGraceLogs,
      activities: state.activities,
      studySubjects: state.studySubjects,
      studyTopics: state.studyTopics,
      studySessions: state.studySessions,
      notes: state.notes,
      dailyReviews: state.dailyReviews,
      rescheduleLogs: state.rescheduleLogs,
      attachments: state.attachments,
      occurrenceOverrides: state.occurrenceOverrides,
    };
    const response = await fetch("/api/sync", {
      method: "POST",
      headers: headers(),
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      console.warn("[sync] push failed:", response.status, await response.text());
    }
  } catch (error) {
    console.warn("[sync] push error:", error);
  } finally {
    pushing = false;
    if (pendingAgain) {
      pendingAgain = false;
      scheduleRemotePush(getState);
    }
  }
}
