import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { getSupabaseServerClient } from "@/lib/supabase/client";
import { requireAdmin, audit } from "@/services/backend/admin";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

/** GET /api/admin/users — list users (profiles + auth metadata) + recent audit. */
export async function GET(request: Request) {
  const ip = clientIp(request);
  if (!rateLimit(`admin:${ip}`)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }
  const guard = await requireAdmin((body, status) =>
    NextResponse.json(body, { status })
  );
  if ("rejection" in guard) return guard.rejection;

  const sb = getSupabaseServerClient();
  if (!sb) return NextResponse.json({ error: "Not configured" }, { status: 503 });

  try {
    const [{ data: profiles, error: profilesError }, { data: authData, error: authError }] =
      await Promise.all([
        sb.from("profiles").select("*").order("created_at", { ascending: false }),
        sb.auth.admin.listUsers(),
      ]);
    if (profilesError) throw new Error(profilesError.message);
    if (authError) throw new Error(authError.message);

    const authById = new Map(
      (authData.users ?? []).map((u) => [u.id, { lastSignIn: u.last_sign_in_at, confirmed: Boolean(u.email_confirmed_at) }])
    );

    const { data: auditRows } = await sb
      .from("audit_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20);

    return NextResponse.json({
      users: (profiles ?? []).map((p: Record<string, unknown>) => ({
        id: p.id,
        email: p.email,
        role: p.role,
        disabled: p.disabled,
        createdAt: p.created_at,
        lastSignIn: authById.get(String(p.id))?.lastSignIn ?? null,
        confirmed: authById.get(String(p.id))?.confirmed ?? false,
      })),
      audit: (auditRows ?? []).map((a: Record<string, unknown>) => ({
        id: a.id,
        action: a.action,
        targetId: a.target_id,
        createdAt: a.created_at,
        meta: a.meta,
      })),
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

/** POST /api/admin/users — create a user (admin generates credentials). */
export async function POST(request: Request) {
  const ip = clientIp(request);
  if (!rateLimit(`admin:${ip}`)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }
  const guard = await requireAdmin((body, status) =>
    NextResponse.json(body, { status })
  );
  if ("rejection" in guard) return guard.rejection;

  const sb = getSupabaseServerClient();
  if (!sb) return NextResponse.json({ error: "Not configured" }, { status: 503 });

  try {
    const body = (await request.json()) as {
      email?: string;
      password?: string;
      role?: "admin" | "user";
    };
    const email = body.email?.trim().toLowerCase();
    if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      return NextResponse.json({ error: "Valid email required" }, { status: 400 });
    }
    const role = body.role === "admin" ? "admin" : "user";
    const generated = !body.password;
    const password = body.password ?? randomBytes(9).toString("base64url");

    const { data, error } = await sb.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (error || !data.user) {
      return NextResponse.json({ error: error?.message ?? "Create failed" }, { status: 400 });
    }

    await sb.from("profiles").upsert({
      id: data.user.id,
      email,
      role,
      disabled: false,
    });

    await audit(guard.profile.userId, "user.create", data.user.id, { email, role, generated });

    return NextResponse.json({
      id: data.user.id,
      email,
      role,
      // Credentials are shown once — the admin hands them to the user.
      password: generated ? password : undefined,
      generated,
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
