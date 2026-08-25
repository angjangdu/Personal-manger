/**
 * Verifies Supabase setup: keys valid, all expected tables exist,
 * occurrence_overrides.user_id present (fixed schema ran), storage bucket ready.
 * Run: node scripts/verify-supabase.mjs
 */
import fs from "node:fs";
import { createClient } from "@supabase/supabase-js";

const env = fs.readFileSync(".env.local", "utf8");
const get = (k) => {
  const m = env.match(new RegExp(`^${k}=(.*)$`, "m"));
  return m ? m[1].trim() : undefined;
};

const url = get("NEXT_PUBLIC_SUPABASE_URL");
const serviceKey = get("SUPABASE_SERVICE_ROLE_KEY");

if (!url || !serviceKey) {
  console.error("❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const sb = createClient(url, serviceKey, { auth: { persistSession: false } });

const EXPECTED = [
  "tags", "projects", "goals", "tasks", "subtasks", "occurrence_overrides",
  "calendar_events", "habits", "habit_logs", "habit_grace_logs", "activities",
  "study_subjects", "study_topics", "study_sessions", "notes",
  "daily_reviews", "reschedule_logs", "attachments",
];

let failures = 0;

// 1. Keys valid + tables exist
for (const table of EXPECTED) {
  const { error } = await sb.from(table).select("*").limit(1);
  if (error) {
    failures++;
    console.log(`❌ ${table}: ${error.message}`);
  } else {
    console.log(`✅ ${table}`);
  }
}

// 2. The fixed schema added occurrence_overrides.user_id
const { error: colErr } = await sb.from("occurrence_overrides").select("user_id").limit(1);
if (colErr) {
  failures++;
  console.log("\n❌ occurrence_overrides.user_id missing → RE-RUN the updated supabase/schema.sql (fix from the 42703 error).");
} else {
  console.log("\n✅ occurrence_overrides.user_id exists (fixed schema applied)");
}

// 3. Storage bucket
const { data: buckets, error: bucketErr } = await sb.storage.listBuckets();
if (bucketErr) {
  failures++;
  console.log(`❌ storage: ${bucketErr.message}`);
} else if (buckets?.some((b) => b.id === "attachments")) {
  console.log("✅ storage bucket 'attachments'");
} else {
  failures++;
  console.log("❌ storage bucket 'attachments' missing");
}

console.log(
  failures === 0
    ? "\n🎉 Supabase fully verified — ready for Phase 22/23 adapters."
    : `\n${failures} issue(s) found — fix above, then re-run: node scripts/verify-supabase.mjs`
);
process.exit(failures === 0 ? 0 : 1);
