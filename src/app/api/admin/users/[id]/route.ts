import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { getSupabaseServerClient } from "@/lib/supabase/client";
import { requireAdmin, audit } from "@/services/backend/admin";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

/**
 * PATCH /api/admin/users/[id]
 * Body: { disabled?: boolean, password?: string, role?: "admin"|"user" }
 * Reset-password generates+returns a one-time password when none supplied.
 */
export async function PATCH(
  request: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const ip = clientIp(request);
  if (!rateLimit(`admin:${ip}`)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }
  const guard = await requireAdmin((body, status) =>
    NextResponse.json(body, { status })
  );
  if ("rejection" in guard) return guard.rejection;

  const { id } = await ctx.params;
  const sb = getSupabaseServerClient();
  if (!sb) return NextResponse.json({ error: "Not configured" }, { status: 503 });

  try {
    const body = (await request.json()) as {
      disabled?: boolean;
      password?: string;
      role?: "admin" | "user";
    };

    // Safety: an admin cannot disable/demote their own account.
    if (id === guard.profile.userId && (body.disabled === true || body.role === "user")) {
      return NextResponse.json(
        { error: "You cannot disable or demote your own account." },
        { status: 400 }
      );
    }

    const updates: Record<string, unknown> = {};
    let generatedPassword: string | undefined;

    if (typeof body.disabled === "boolean") {
      updates.ban_duration = body.disabled ? "100y" : "none";
    }
    if (body.password !== undefined) {
      generatedPassword =
        body.password || randomBytes(9).toString("base64url");
      updates.password = generatedPassword;
    }
    if (body.role !== undefined) {
      if (body.role !== "admin" && body.role !== "user") {
        return NextResponse.json({ error: "Invalid role" }, { status: 400 });
      }
      updates.role = body.role;
      await sb.from("profiles").update({ role: body.role }).eq("id", id);
    }

    if (Object.keys(updates).length > 0) {
      const { error } = await sb.auth.admin.updateUserById(id, updates);
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    }
    if (typeof body.disabled === "boolean") {
      await sb.from("profiles").update({ disabled: body.disabled }).eq("id", id);
    }

    const action =
      body.password !== undefined
        ? "user.reset_password"
        : body.disabled !== undefined
          ? body.disabled
            ? "user.disable"
            : "user.enable"
          : "user.update_role";

    await audit(guard.profile.userId, action, id, {
      role: body.role,
      generated: generatedPassword !== undefined,
    });

    return NextResponse.json({
      ok: true,
      password: generatedPassword,
      generated: generatedPassword !== undefined,
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
