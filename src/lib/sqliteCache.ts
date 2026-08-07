import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import config from "@/config";

let db: DatabaseSync | null = null;
let lastPurgeAt = 0;
const PURGE_INTERVAL_MS = 60_000;

function getDb(): DatabaseSync {
  if (db) return db;

  mkdirSync(dirname(config.CACHE_SQLITE_PATH), { recursive: true });
  db = new DatabaseSync(config.CACHE_SQLITE_PATH);
  db.exec("PRAGMA journal_mode = WAL;");
  db.exec("PRAGMA busy_timeout = 5000;");
  db.exec(
    `CREATE TABLE IF NOT EXISTS cache (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      expires_at INTEGER NOT NULL
    );`,
  );
  db.exec(
    "CREATE INDEX IF NOT EXISTS cache_expires_at_idx ON cache (expires_at);",
  );
  return db;
}

function maybePurgeExpired(): void {
  const now = Date.now();
  if (now - lastPurgeAt < PURGE_INTERVAL_MS) return;
  lastPurgeAt = now;
  getDb()
    .prepare("DELETE FROM cache WHERE expires_at != 0 AND expires_at <= ?")
    .run(now);
}

export function sqliteSet(
  key: string,
  value: string,
  ttlSeconds: number,
): void {
  maybePurgeExpired();
  const expiresAt = ttlSeconds > 0 ? Date.now() + ttlSeconds * 1000 : 0;
  getDb()
    .prepare(
      `INSERT INTO cache (key, value, expires_at) VALUES (?, ?, ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value, expires_at = excluded.expires_at`,
    )
    .run(key, value, expiresAt);
}

export function sqliteGet(key: string): string | null {
  maybePurgeExpired();
  const row = getDb()
    .prepare("SELECT value, expires_at FROM cache WHERE key = ?")
    .get(key) as { value: string; expires_at: number } | undefined;

  if (!row) return null;
  if (row.expires_at !== 0 && row.expires_at <= Date.now()) {
    getDb().prepare("DELETE FROM cache WHERE key = ?").run(key);
    return null;
  }
  return row.value;
}

export function sqliteDel(key: string): void {
  getDb().prepare("DELETE FROM cache WHERE key = ?").run(key);
}

export function sqliteIncr(
  key: string,
  windowSeconds: number,
): { count: number; ttl: number } {
  maybePurgeExpired();
  const database = getDb();
  const now = Date.now();

  database.exec("BEGIN IMMEDIATE");
  try {
    const row = database
      .prepare("SELECT value, expires_at FROM cache WHERE key = ?")
      .get(key) as { value: string; expires_at: number } | undefined;

    const expired = row && row.expires_at !== 0 && row.expires_at <= now;
    const expiresAt = now + windowSeconds * 1000;

    let count: number;
    if (!row || expired) {
      count = 1;
      database
        .prepare(
          `INSERT INTO cache (key, value, expires_at) VALUES (?, ?, ?)
           ON CONFLICT(key) DO UPDATE SET value = excluded.value, expires_at = excluded.expires_at`,
        )
        .run(key, String(count), expiresAt);
      database.exec("COMMIT");
      return { count, ttl: windowSeconds };
    }

    count = (parseInt(row.value, 10) || 0) + 1;
    database
      .prepare("UPDATE cache SET value = ? WHERE key = ?")
      .run(String(count), key);
    database.exec("COMMIT");

    const ttl = Math.max(Math.ceil((row.expires_at - now) / 1000), 0);
    return { count, ttl };
  } catch (err) {
    database.exec("ROLLBACK");
    throw err;
  }
}

export function sqliteFlush(): void {
  getDb().exec("DELETE FROM cache;");
}
