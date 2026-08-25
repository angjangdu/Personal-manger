"use client";

import { useCallback, useEffect, useState } from "react";
import { KeyRound, Plus, ShieldCheck, UserCog, UserX } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { AdminUser, AdminAuditEntry } from "@/lib/admin-types";

export default function AdminPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [audit, setAudit] = useState<AdminAuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [creds, setCreds] = useState<{ email: string; password: string } | null>(null);

  const load = useCallback(async () => {
    const response = await fetch("/api/admin/users");
    if (response.status === 403 || response.status === 401) {
      setForbidden(true);
      setLoading(false);
      return;
    }
    const data = await response.json();
    setUsers(data.users ?? []);
    setAudit(data.audit ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    void (async () => {
      await load();
    })();
  }, [load]);

  async function patch(id: string, body: Record<string, unknown>, okMessage: string) {
    const response = await fetch(`/api/admin/users/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await response.json();
    if (!response.ok) {
      toast(data.error ?? "Action failed");
      return;
    }
    if (data.password) {
      setCreds({ email: users.find((u) => u.id === id)?.email ?? "", password: data.password });
    } else {
      toast(okMessage);
    }
    void load();
  }

  if (forbidden) {
    return (
      <div className="py-16 text-center">
        <ShieldCheck className="text-muted-foreground mx-auto size-10" aria-hidden />
        <h2 className="mt-3 text-lg font-semibold">Admin only</h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Your account does not have the admin role.
        </p>
      </div>
    );
  }

  return (
    <>
      <PageHeader title="Admin" description="User management and audit trail">
        <Button onClick={() => setCreateOpen(true)}>
          <Plus aria-hidden /> Create user
        </Button>
      </PageHeader>

      {/* Credentials modal (shown once on generated passwords) */}
      <Dialog open={Boolean(creds)} onOpenChange={(o) => !o && setCreds(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Credentials generated</DialogTitle>
            <DialogDescription>
              Hand these to the user now — the password is not stored in
              readable form and cannot be shown again.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 rounded-lg border p-3 text-sm">
            <p>
              <span className="text-muted-foreground">Email:</span>{" "}
              <span className="font-mono">{creds?.email}</span>
            </p>
            <p>
              <span className="text-muted-foreground">Password:</span>{" "}
              <span className="font-mono font-semibold">{creds?.password}</span>
            </p>
          </div>
          <DialogFooter>
            <Button
              onClick={() => {
                if (creds) void navigator.clipboard.writeText(`${creds.email} / ${creds.password}`);
                toast("Copied");
              }}
            >
              <KeyRound aria-hidden /> Copy
            </Button>
            <Button variant="ghost" onClick={() => setCreds(null)}>
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <CreateUserDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={(created) => {
          setCreateOpen(false);
          setCreds({ email: created.email, password: created.password });
          void load();
        }}
      />

      {/* Users table */}
      <section className="mb-8">
        <h3 className="mb-2 text-sm font-semibold">Users</h3>
        {loading ? (
          <p className="text-muted-foreground text-sm">Loading…</p>
        ) : (
          <ul className="divide-y overflow-hidden rounded-xl border">
            {users.map((user) => (
              <li key={user.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{user.email}</p>
                  <p className="text-muted-foreground text-xs tabular-nums">
                    {user.lastSignIn
                      ? `last sign-in ${new Date(user.lastSignIn).toLocaleDateString("en-GB", { month: "short", day: "numeric" })}`
                      : "never signed in"}
                    {user.confirmed ? "" : " · unconfirmed"}
                  </p>
                </div>
                <Badge variant={user.role === "admin" ? "default" : "secondary"}>
                  {user.role === "admin" && <ShieldCheck className="mr-1 size-3" aria-hidden />}
                  {user.role}
                </Badge>
                {user.disabled && (
                  <Badge variant="outline" className="border-red-500/50 text-red-600 dark:text-red-400">
                    <UserX className="mr-1 size-3" aria-hidden /> disabled
                  </Badge>
                )}
                <div className="flex shrink-0 gap-1.5">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      void patch(user.id, { password: "" }, "Password reset")
                    }
                    aria-label={`Reset password for ${user.email}`}
                  >
                    <KeyRound aria-hidden /> Reset
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={user.role === "admin" && user.disabled === false && users.filter((u) => u.role === "admin" && !u.disabled).length <= 1}
                    onClick={() =>
                      void patch(user.id, { disabled: !user.disabled }, user.disabled ? "Enabled" : "Disabled")
                    }
                    aria-label={user.disabled ? `Enable ${user.email}` : `Disable ${user.email}`}
                  >
                    <UserCog aria-hidden /> {user.disabled ? "Enable" : "Disable"}
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Audit trail */}
      <section>
        <h3 className="mb-2 text-sm font-semibold">Recent admin activity</h3>
        {audit.length === 0 ? (
          <p className="text-muted-foreground rounded-xl border border-dashed px-4 py-4 text-center text-sm">
            No admin actions recorded yet.
          </p>
        ) : (
          <ul className="divide-y overflow-hidden rounded-xl border">
            {audit.map((entry) => (
              <li key={entry.id} className="text-muted-foreground flex items-center gap-3 px-4 py-2 text-xs">
                <span className="font-medium text-foreground">{entry.action}</span>
                <span className="truncate">
                  {users.find((u) => u.id === entry.targetId)?.email ?? entry.targetId ?? ""}
                </span>
                <span className="ml-auto shrink-0 tabular-nums">
                  {new Date(entry.createdAt).toLocaleString("en-GB", {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}

function CreateUserDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (created: { email: string; password: string }) => void;
}) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"user" | "admin">("user");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const response = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, role }),
    });
    const data = await response.json();
    setBusy(false);
    if (!response.ok) {
      setError(data.error ?? "Create failed");
      return;
    }
    setEmail("");
    onCreated({ email: data.email, password: data.password });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Create user</DialogTitle>
          <DialogDescription>
            Leave the password empty to auto-generate credentials.
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={submit}>
          <div className="space-y-2">
            <Label htmlFor="new-user-email">Email</Label>
            <Input
              id="new-user-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
            />
          </div>
          <div className="space-y-2">
            <Label>Role</Label>
            <Select value={role} onValueChange={(v) => setRole(v as "user" | "admin")}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {error && <p className="text-destructive text-sm">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={busy || !email.trim()}>
              {busy ? "Creating…" : "Create user"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
