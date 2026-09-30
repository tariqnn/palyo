import "server-only";
import { PGlite } from "@electric-sql/pglite";
import { Pool, type PoolClient } from "pg";
import { readFile } from "node:fs/promises";
import path from "node:path";

type Queryable = { query: (sql: string, params?: unknown[]) => Promise<{ rows: Record<string, unknown>[] }> };
const globalDb = globalThis as typeof globalThis & { playoDb?: Promise<Queryable>; playoPool?: Pool };

async function connect(): Promise<Queryable> {
  if (process.env.DATABASE_URL) {
    globalDb.playoPool ??= new Pool({ connectionString: process.env.DATABASE_URL, max: 3, connectionTimeoutMillis: 10000 });
    return globalDb.playoPool as Queryable;
  }
  if (process.env.NODE_ENV === "production") {
    throw new Error("DATABASE_URL is required in production. Configure hosted PostgreSQL before deploying.");
  }
  const db = new PGlite(process.env.PLAYO_DB_DIR || ".playo-db");
  const sql = await readFile(path.join(process.cwd(), "db/migrations/001_init.sql"), "utf8");
  await db.exec(sql);
  return db as unknown as Queryable;
}
export async function database(): Promise<Queryable> {
  globalDb.playoDb ??= connect();
  return globalDb.playoDb;
}
export async function query<T = Record<string, unknown>>(sql: string, params: unknown[] = []): Promise<T[]> {
  const db = await database();
  const result = await db.query(sql, params);
  return result.rows as T[];
}
export async function one<T = Record<string, unknown>>(sql: string, params: unknown[] = []): Promise<T | null> {
  return (await query<T>(sql, params))[0] ?? null;
}
export async function transaction<T>(fn: (tx: Queryable) => Promise<T>): Promise<T> {
  if (process.env.DATABASE_URL) {
    await database();
    const client: PoolClient = await globalDb.playoPool!.connect();
    try { await client.query("BEGIN"); const value = await fn(client as Queryable); await client.query("COMMIT"); return value; }
    catch (error) { await client.query("ROLLBACK"); throw error; }
    finally { client.release(); }
  }
  const db = await database() as unknown as PGlite;
  return db.transaction(async (tx) => fn(tx as unknown as Queryable));
}
