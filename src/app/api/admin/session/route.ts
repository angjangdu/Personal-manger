import { NextResponse } from "next/server";
import { getProfile } from "@/services/backend/admin";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

/** GET /api/admin/session — the signed-in user's role/disabled state. */
export async function GET(request: Request) {
  const ip = clientIp(request);
  if (!rateLimit(`admin-session:${ip}`)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }
  const profile = await getProfile();
  if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (profile.disabled) {
    return NextResponse.json({ error: "Account disabled" }, { status: 403 });
  }
  return NextResponse.json({
    email: profile.email,
    role: profile.role,
    isAdmin: profile.role === "admin",
  });
}
