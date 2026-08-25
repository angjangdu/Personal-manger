import { getSupabaseServerClient } from "@/lib/supabase/client";
import { getSessionUserId } from "@/lib/supabase/server";

export interface AdminContext {
  userId: string;
  email: string;
  role: "admin" | "user";
  disabled: boolean;
}

/**
 * Resolves the session user's profile (Phase 26/27).
 * Returns null when unauthenticated. `disabled` is enforced by callers.
 */
export async function getProfile(): Promise<AdminContext | null> {
  const userId = await getSessionUserId();
  if (!userId) return null;
  const sb = getSupabaseServerClient();
  if (!sb) return null;
  const { data, error } = await sb
    .from("profiles")
    .select("email, role, disabled")
    .eq("id", userId)
    .single();
  if (error || !data) return { userId, email: "", role: "user", disabled: false };
  return {
    userId,
    email: data.email,
    role: data.role as "admin" | "user",
    disabled: Boolean(data.disabled),
  };
}

/** Admin-only guard: returns the profile or a NextResponse rejection. */
export async function requireAdmin(
  createResponse: (body: unknown, status: number) => Response
): Promise<{ profile: AdminContext } | { rejection: Response }> {
  const profile = await getProfile();
  if (!profile) return { rejection: createResponse({ error: "Unauthorized" }, 401) };
  if (profile.disabled) {
    return { rejection: createResponse({ error: "Account disabled" }, 403) };
  }
  if (profile.role !== "admin") {
    return { rejection: createResponse({ error: "Admin only" }, 403) };
  }
  return { profile };
}

/** Records an administrative action in the audit log. */
export async function audit(
  actorId: string,
  action: string,
  targetId?: string | null,
  meta?: Record<string, unknown>
): Promise<void> {
  const sb = getSupabaseServerClient();
  if (!sb) return;
  await sb.from("audit_logs").insert({
    actor_id: actorId,
    action,
    target_id: targetId ?? null,
    meta: meta ?? null,
  });
}
