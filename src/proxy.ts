import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/client";

/**
 * Session refresh + route protection (Phase 25). Next 16 proxy convention.
 * Active only when NEXT_PUBLIC_DATA_SOURCE=supabase — local mode has no login.
 * There is NO public signup (review/plan rule): accounts are created by the
 * admin/claim flow, not here.
 */
export async function proxy(request: NextRequest) {
  const dataSource = process.env.NEXT_PUBLIC_DATA_SOURCE;
  if (dataSource !== "supabase") return NextResponse.next();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return NextResponse.next();

  let response = NextResponse.next({ request });
  const sb = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookiesToSet) => {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  const {
    data: { user },
  } = await sb.auth.getUser();

  const path = request.nextUrl.pathname;
  const isLogin = path === "/login";
  const isApi = path.startsWith("/api");
  const isPwaAsset =
    path === "/manifest.webmanifest" ||
    path === "/sw.js" ||
    path === "/offline.html" ||
    path.startsWith("/icons/");

  if (isPwaAsset) return response;

  if (!user && !isLogin && !isApi) {
    const redirect = request.nextUrl.clone();
    redirect.pathname = "/login";
    return NextResponse.redirect(redirect);
  }
  if (user && isLogin) {
    const redirect = request.nextUrl.clone();
    redirect.pathname = "/dashboard";
    return NextResponse.redirect(redirect);
  }

  // Phase 26/27: disabled accounts are signed out; non-admins cannot open
  // /admin — enforced here AND in every admin API route.
  if (user && !isApi) {
    const admin = getSupabaseServerClient();
    if (admin) {
      const { data: profile } = await admin
        .from("profiles")
        .select("disabled, role")
        .eq("id", user.id)
        .single();
      if (profile?.disabled) {
        const redirect = request.nextUrl.clone();
        redirect.pathname = "/login";
        redirect.search = "disabled=1";
        const redirectResponse = NextResponse.redirect(redirect);
        for (const cookie of request.cookies.getAll()) {
          if (cookie.name.includes("auth-token")) {
            redirectResponse.cookies.delete(cookie.name);
          }
        }
        return redirectResponse;
      }
      const isAdminRoute =
        path === "/admin" || path.startsWith("/admin/");
      if (isAdminRoute && profile?.role !== "admin") {
        const redirect = request.nextUrl.clone();
        redirect.pathname = "/dashboard";
        return NextResponse.redirect(redirect);
      }
    }
  }
  return response;
}

export const config = {
  matcher: [
    // Skip static assets.
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
