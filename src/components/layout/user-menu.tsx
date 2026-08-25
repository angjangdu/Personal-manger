"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, ShieldCheck, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getSupabaseAuthBrowserClient } from "@/lib/supabase/browser";
import { DATA_SOURCE } from "@/lib/supabase/client";

interface SessionInfo {
  email: string;
  isAdmin: boolean;
}

/** Signed-in identity, admin link, sign out (Phase 25/26). Hidden in local mode. */
export function UserMenu() {
  const router = useRouter();
  const [session, setSession] = useState<SessionInfo | null>(null);

  useEffect(() => {
    if (DATA_SOURCE !== "supabase") return;
    void (async () => {
      const response = await fetch("/api/admin/session");
      if (!response.ok) return;
      setSession(await response.json());
    })();
  }, []);

  if (DATA_SOURCE !== "supabase" || !session) return null;

  async function signOut() {
    const sb = getSupabaseAuthBrowserClient();
    await sb?.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label="Account">
          <User aria-hidden />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel className="truncate">{session.email}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {session.isAdmin && (
          <DropdownMenuItem onClick={() => router.push("/admin")}>
            <ShieldCheck aria-hidden /> Admin dashboard
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={() => void signOut()}>
          <LogOut aria-hidden /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
