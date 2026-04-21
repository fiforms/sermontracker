import { DatabaseSync } from 'node:sqlite';
import { drizzle } from 'drizzle-orm/sqlite-proxy';
import { migrate } from 'drizzle-orm/sqlite-proxy/migrator';
import * as schema from './schema.js';
import { users } from './schema.js';
import { eq } from 'drizzle-orm';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

const dbPath = process.env.DATABASE_PATH ?? join(__dirname, '../../sermontracker.db');
const migrationsFolder = join(__dirname, '../../drizzle');

const client = new DatabaseSync(dbPath);
client.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');

export const db = drizzle(
  async (sql, params, method) => {
    const stmt = client.prepare(sql);
    if (method === 'run') {
      stmt.run(...params);
      return { rows: [] };
    }
    if (method === 'get') {
      const row = stmt.get(...params) as Record<string, unknown> | undefined;
      if (!row) return { rows: [] };
      return { rows: [Object.values(row)] };
    }
    const rows = stmt.all(...params) as Record<string, unknown>[];
    if (rows.length === 0) return { rows: [] };
    const cols = Object.keys(rows[0]);
    return { rows: rows.map((r) => cols.map((c) => r[c])) };
  },
  { schema },
);

await migrate(db, async (queries) => {
  for (const q of queries) client.exec(q);
}, { migrationsFolder });

// Seed the dev fallback user (id=1). Used when AUTH_MODE != 'proxy'.
client.exec(`INSERT OR IGNORE INTO users (id, name, email) VALUES (1, 'Pastor', 'pastor@local')`);

export const DEFAULT_USER_ID = 1;

export async function findOrCreateUser(email: string, name: string): Promise<number> {
  const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, email));
  if (existing[0]) return existing[0].id;
  const [row] = await db.insert(users).values({ email, name }).returning({ id: users.id });
  return row.id;
}
