import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { DATA_SOURCE, SUPABASE_ANON_KEY, SUPABASE_URL } from "@/lib/supabase/client";

/**
 * Cookie-based auth client for server components / route handlers.
 * Reads and refreshes the session cookies in the current request scope.
 */
export async function getSupabaseAuthServerClient() {
  if (DATA_SOURCE !== "supabase") return null;
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return null;
  const cookieStore = await cookies();
  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (cookiesToSet) => {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Called from a Server Component — middleware refreshes instead.
        }
      },
    },
  });
}

/** Returns the signed-in user id, or null. */
export async function getSessionUserId(): Promise<string | null> {
  const sb = await getSupabaseAuthServerClient();
  if (!sb) return null;
  const {
    data: { user },
  } = await sb.auth.getUser();
  return user?.id ?? null;
}
