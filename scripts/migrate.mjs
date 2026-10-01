import { PGlite } from "@electric-sql/pglite";
import pg from "pg";
import { readFile, readdir } from "node:fs/promises";

const files=(await readdir("db/migrations")).filter(file=>file.endsWith(".sql")).sort();
const migrationUrl = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
if (migrationUrl) {
  const connectionString = migrationUrl.replace(/([?&])sslmode=(?:prefer|require|verify-ca)(?=&|$)/i, "$1sslmode=verify-full");
  const client = new pg.Client({ connectionString });
  await client.connect();
  try { for(const file of files)await client.query(await readFile(`db/migrations/${file}`,"utf8")); } finally { await client.end(); }
} else {
  const db = new PGlite(process.env.PLAYUP_DB_DIR || process.env.PLAYO_DB_DIR || ".playup-db");
  try { for(const file of files)await db.exec(await readFile(`db/migrations/${file}`,"utf8")); } finally { await db.close(); }
}
console.log("Database migration complete.");
