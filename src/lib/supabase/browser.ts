import { createBrowserClient } from "@supabase/ssr";
import { DATA_SOURCE, SUPABASE_ANON_KEY, SUPABASE_URL } from "@/lib/supabase/client";

let browserAuthClient: ReturnType<typeof createBrowserClient> | null = null;

/** Cookie-based auth client for client components (RLS applies). */
export function getSupabaseAuthBrowserClient() {
  if (DATA_SOURCE !== "supabase") return null;
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return null;
  if (!browserAuthClient) {
    browserAuthClient = createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
  return browserAuthClient;
}
