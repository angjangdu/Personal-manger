"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Zap, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getSupabaseAuthBrowserClient } from "@/lib/supabase/browser";

/**
 * Login — there is NO public signup (product rule). Accounts exist only via
 * the admin/claim flow; see the note below for claiming the owner account.
 */
export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const sb = getSupabaseAuthBrowserClient();
    if (!sb) {
      setError("Auth is not configured (DATA_SOURCE != supabase).");
      return;
    }
    setBusy(true);
    const { error: authError } = await sb.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setBusy(false);
    if (authError) {
      setError(authError.message);
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="bg-background flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="bg-primary text-primary-foreground mx-auto mb-2 flex size-10 items-center justify-center rounded-lg">
            <Zap className="size-5" aria-hidden />
          </div>
          <CardTitle className="text-xl">Personal OS</CardTitle>
          <CardDescription>Sign in to your workspace</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={submit}>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                required
                autoFocus
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {error && (
              <p className="text-destructive text-sm" role="alert">
                {error}
              </p>
            )}
            <Button type="submit" className="w-full" disabled={busy}>
              <LogIn aria-hidden /> {busy ? "Signing in…" : "Sign in"}
            </Button>
          </form>

          <div className="border-t pt-3 mt-5">
            <p className="text-muted-foreground text-[11px] leading-relaxed">
              No account and no signup — by design. First run claims the owner:
              <code className="bg-muted mx-1 rounded px-1 py-0.5">
                npm run set:owner -- you@example.com YourPassword
              </code>
              then sign in here.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
