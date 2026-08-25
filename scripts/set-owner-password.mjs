/**
 * Sets (or creates) the owner account's password using the service-role key.
 * Run:  npm run set:owner -- you@example.com YourStrongPassword
 */
import fs from "node:fs";
import { createClient } from "@supabase/supabase-js";

const [email, password] = process.argv.slice(2);
if (!email || !password) {
  console.error("Usage: npm run set:owner -- <email> <new-password>");
  process.exit(1);
}
if (password.length < 8) {
  console.error("❌ Password must be at least 8 characters.");
  process.exit(1);
}

const env = fs.readFileSync(".env.local", "utf8");
const get = (k) => env.match(new RegExp(`^${k}=(.*)$`, "m"))?.[1]?.trim();
const url = get("NEXT_PUBLIC_SUPABASE_URL");
const serviceKey = get("SUPABASE_SERVICE_ROLE_KEY");
if (!url || !serviceKey) {
  console.error("❌ Missing SUPABASE_URL / SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const sb = createClient(url, serviceKey, { auth: { persistSession: false } });

const { data: list, error: listError } = await sb.auth.admin.listUsers();
if (listError) {
  console.error("❌ listUsers:", listError.message);
  process.exit(1);
}

const existing = list.users.find(
  (u) => u.email?.toLowerCase() === email.toLowerCase()
);

if (existing) {
  const { error } = await sb.auth.admin.updateUserById(existing.id, {
    password,
    email_confirm: true,
  });
  if (error) {
    console.error("❌ update:", error.message);
    process.exit(1);
  }
  await claimAdminProfile(url, serviceKey, existing.id, email);
  console.log(`✅ Password set for ${email} (${existing.id})`);
} else {
  const { data, error } = await sb.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error || !data.user) {
    console.error("❌ create:", error?.message ?? "no user");
    process.exit(1);
  }
  await claimAdminProfile(url, serviceKey, data.user.id, email);
  console.log(`✅ Owner account created: ${email} (${data.user.id})`);
}
console.log("→ Sign in at /login with these credentials.");

/** Phase 26: the owner is the first admin — profile claims the role. */
async function claimAdminProfile(url, serviceKey, id, email) {
  const admin = createClient(url, serviceKey, { auth: { persistSession: false } });
  const { error } = await admin
    .from("profiles")
    .upsert({ id, email, role: "admin", disabled: false });
  if (error) console.error("⚠ profile upsert:", error.message);
  else console.log("   profile: role=admin, enabled");
}
