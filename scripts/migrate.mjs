import { PGlite } from "@electric-sql/pglite";
import pg from "pg";
import { readFile } from "node:fs/promises";

const sql = await readFile("db/migrations/001_init.sql", "utf8");
if (process.env.DATABASE_URL) {
  const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  try { await client.query(sql); } finally { await client.end(); }
} else {
  const db = new PGlite(process.env.PLAYO_DB_DIR || ".playo-db");
  try { await db.exec(sql); } finally { await db.close(); }
}
console.log("Database migration complete.");
