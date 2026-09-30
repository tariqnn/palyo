import { PGlite } from "@electric-sql/pglite";
import pg from "pg";
import { readFile } from "node:fs/promises";

const sql = await readFile("db/migrations/001_init.sql", "utf8");
const migrationUrl = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
if (migrationUrl) {
  const connectionString = migrationUrl.replace(/([?&])sslmode=(?:prefer|require|verify-ca)(?=&|$)/i, "$1sslmode=verify-full");
  const client = new pg.Client({ connectionString });
  await client.connect();
  try { await client.query(sql); } finally { await client.end(); }
} else {
  const db = new PGlite(process.env.PLAYO_DB_DIR || ".playo-db");
  try { await db.exec(sql); } finally { await db.close(); }
}
console.log("Database migration complete.");
