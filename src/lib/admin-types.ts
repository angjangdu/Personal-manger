export interface AdminUser {
  id: string;
  email: string;
  role: "admin" | "user";
  disabled: boolean;
  createdAt: string;
  lastSignIn: string | null;
  confirmed: boolean;
}

export interface AdminAuditEntry {
  id: string;
  action: string;
  targetId: string | null;
  createdAt: string;
  meta: unknown;
}
