import { DatabaseSync } from 'node:sqlite';
import { drizzle } from 'drizzle-orm/sqlite-proxy';
import { migrate } from 'drizzle-orm/sqlite-proxy/migrator';
import * as schema from './schema.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

const client = new DatabaseSync(join(__dirname, '../../sermontracker.db'));
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

const migrationsFolder = join(__dirname, '../../drizzle');
await migrate(db, async (queries) => {
  for (const q of queries) client.exec(q);
}, { migrationsFolder });

// Seed the default single user directly via the raw client — avoids async proxy quirks.
client.exec(`INSERT OR IGNORE INTO users (id, name, email) VALUES (1, 'Pastor', 'pastor@local')`);

export const DEFAULT_USER_ID = 1;
