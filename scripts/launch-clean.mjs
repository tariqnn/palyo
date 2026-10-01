// Removes all sample/demo content and keeps ONLY the admin account, ready for real data.
// Usage: LAUNCH_CLEAN=yes DATABASE_URL=... node scripts/launch-clean.mjs
import pg from "pg";

if (process.env.LAUNCH_CLEAN !== "yes") throw new Error("Refusing to run: set LAUNCH_CLEAN=yes to confirm you want to delete all sample data.");
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required.");

const db = new pg.Client({ connectionString: process.env.DATABASE_URL });
await db.connect();
try {
  await db.query("BEGIN");
  const admin = (await db.query("SELECT id,email FROM users WHERE role IN ('SUPER_ADMIN','ADMIN') ORDER BY CASE role WHEN 'SUPER_ADMIN' THEN 0 ELSE 1 END, created_at LIMIT 1")).rows[0];
  if (!admin) throw new Error("No admin account found; refusing to wipe.");
  const tables = (await db.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE' AND table_name <> 'users'")).rows.map(r => `"${r.table_name}"`);
  await db.query(`TRUNCATE ${tables.join(", ")} RESTART IDENTITY CASCADE`);
  await db.query("DELETE FROM users WHERE id<>$1", [admin.id]);
  await db.query("UPDATE users SET email=$2, name='PlayUp Admin', xp=0, academy_id=NULL, permissions='{}', bio='' WHERE id=$1", [admin.id, "admin@playup.local"]);
  const counts = {};
  for (const t of ["users", "venues", "games", "bookings", "academies", "activities", "offers", "tournaments"]) counts[t] = Number((await db.query(`SELECT count(*) FROM ${t}`)).rows[0].count);
  if (counts.users !== 1) throw new Error("Safety check failed: the admin account must be the only user left.");
  await db.query("COMMIT");
  console.log("Sample data removed. Remaining rows:", counts);
} catch (error) {
  await db.query("ROLLBACK");
  throw error;
} finally {
  await db.end();
}
