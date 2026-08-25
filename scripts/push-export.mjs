/**
 * Pushes a Settings→Export JSON snapshot into Supabase via /api/sync.
 * Usage: 1) export from Settings, 2) npm run dev, 3) node scripts/push-export.mjs [path]
 */
import fs from "node:fs";

const file = process.argv[2] ?? "personal-os-export.json";
const baseUrl = process.env.PUSH_URL ?? "http://localhost:3000";

const env = fs.readFileSync(".env.local", "utf8");
const get = (k) => env.match(new RegExp(`^${k}=(.*)$`, "m"))?.[1]?.trim();
const secret = get("NEXT_PUBLIC_SYNC_SECRET");
if (!secret) {
  console.error("❌ NEXT_PUBLIC_SYNC_SECRET missing in .env.local");
  process.exit(1);
}
if (!fs.existsSync(file)) {
  console.error(`❌ Export file not found: ${file}\n   Export it from Settings → Export JSON first.`);
  process.exit(1);
}

const payload = JSON.parse(fs.readFileSync(file, "utf8"));
console.log(`Pushing ${file} → ${baseUrl}/api/sync …`);

const response = await fetch(`${baseUrl}/api/sync`, {
  method: "POST",
  headers: { "content-type": "application/json", "x-sync-secret": secret },
  body: JSON.stringify(payload),
});

const body = await response.json();
if (!response.ok) {
  console.error(`❌ ${response.status}:`, body);
  process.exit(1);
}
console.log("✅ Pushed:", body.counts);
