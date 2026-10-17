import pg from "pg";
import { hash, compare } from "bcryptjs";
import { randomUUID } from "node:crypto";

const email = (process.env.PLAYUP_OWNER_EMAIL || "admin@playup.local").trim().toLowerCase();
const password = process.env.PLAYUP_OWNER_PASSWORD || process.env.PLAYUP_ADMIN_PASSWORD || process.argv[2];
const connectionString = process.env.DATABASE_URL_UNPOOLED || process.env.POSTGRES_URL_NON_POOLING || process.env.DATABASE_URL;

if (!password || password.length < 10) throw new Error("PLAYUP_OWNER_PASSWORD must contain at least 10 characters.");
if (!connectionString) throw new Error("Production database configuration is unavailable.");

const db = new pg.Client({ connectionString, ssl: { rejectUnauthorized: false } });
await db.connect();

try {
  await db.query("BEGIN");
  const existing = (await db.query(
    "SELECT id, email FROM users WHERE lower(email)=lower($1) FOR UPDATE",
    [email]
  )).rows[0];
  if (!existing) throw new Error(`Owner account ${email} does not exist; refusing to create an unreviewed production identity.`);

  const passwordHash = await hash(password, 12);
  await db.query(
    "UPDATE users SET password_hash=$1, role='SUPER_ADMIN', name='PlayUp Owner' WHERE id=$2",
    [passwordHash, existing.id]
  );
  await db.query("DELETE FROM sessions WHERE user_id=$1", [existing.id]);
  await db.query(
    `INSERT INTO audit_logs(id, actor_id, action, entity, entity_id, new_data)
     VALUES($1, $2, 'OWNER_LOGIN_SYNCED', 'user', $2, $3)`,
    [randomUUID(), existing.id, JSON.stringify({ email, role: "SUPER_ADMIN" })]
  );
  await db.query("COMMIT");

  const saved = (await db.query("SELECT email, username, role, password_hash FROM users WHERE id=$1", [existing.id])).rows[0];
  const passwordVerified = Boolean(saved && await compare(password, saved.password_hash));
  if (!passwordVerified || saved.role !== "SUPER_ADMIN") throw new Error("Owner credential verification failed after update.");

  console.log(JSON.stringify({ status: "ok", email: saved.email, username: saved.username, role: saved.role, passwordVerified }, null, 2));
} catch (error) {
  await db.query("ROLLBACK");
  throw error;
} finally {
  await db.end();
}
