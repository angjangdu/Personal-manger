"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, User } from "lucide-react";
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

/** Signed-in identity + sign out (Phase 25). Hidden in local mode. */
export function UserMenu() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    if (DATA_SOURCE !== "supabase") return;
    const sb = getSupabaseAuthBrowserClient();
    if (!sb) return;
    void (async () => {
      const { data } = await sb.auth.getUser();
      setEmail(data.user?.email ?? null);
    })();
  }, []);

  if (DATA_SOURCE !== "supabase" || !email) return null;

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
        <DropdownMenuLabel className="truncate">{email}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => void signOut()}>
          <LogOut aria-hidden /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
