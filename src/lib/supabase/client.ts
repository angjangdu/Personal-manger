import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Data-source switch (Phase 21).
 *
 *   NEXT_PUBLIC_DATA_SOURCE=local      → frozen local store (default)
 *   NEXT_PUBLIC_DATA_SOURCE=supabase   → adapters read/write Postgres
 *
 * Clients are null until credentials exist; callers must handle null and
 * fall back to the local store. The service-role client is server-only.
 */

export const DATA_SOURCE =
  (process.env.NEXT_PUBLIC_DATA_SOURCE as "local" | "supabase" | undefined) ??
  "local";

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let browserClient: SupabaseClient | null = null;

/** Browser client keyed to the logged-in user (RLS applies). */
export function getSupabaseBrowserClient(): SupabaseClient | null {
  if (DATA_SOURCE !== "supabase") return null;
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return null;
  if (!browserClient) {
    browserClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: true, autoRefreshToken: true },
    });
  }
  return browserClient;
}

let serverClient: SupabaseClient | null = null;

/**
 * Server-only client. Bypasses RLS — never import from a client component
 * and never expose SUPABASE_SERVICE_ROLE_KEY to the browser.
 */
export function getSupabaseServerClient(): SupabaseClient | null {
  if (DATA_SOURCE !== "supabase") return null;
  if (!SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) return null;
  if (!serverClient) {
    serverClient = createClient(
      SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { persistSession: false, autoRefreshToken: false } }
    );
  }
  return serverClient;
}
