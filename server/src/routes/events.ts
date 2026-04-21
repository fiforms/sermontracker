import { Hono } from 'hono';
import { db, DEFAULT_USER_ID } from '../db/index.js';
import { sermonEvents, sermons, churches } from '../db/schema.js';
import { eq, and, desc, sql } from 'drizzle-orm';

const app = new Hono();

// Flat select with explicit aliases avoids column-name collisions when
// multiple joined tables share a column name (e.g. "id", "created_at").
const flatSelect = {
  id: sermonEvents.id,
  date: sermonEvents.date,
  scriptureReading: sermonEvents.scriptureReading,
  openingHymn: sermonEvents.openingHymn,
  closingHymn: sermonEvents.closingHymn,
  notes: sermonEvents.notes,
  sermonId: sql`${sermons.id}`.as('sermon_id'),
  sermonTitle: sermons.title,
  sermonDescription: sermons.description,
  churchId: sql`${churches.id}`.as('church_id'),
  churchName: churches.name,
  churchCity: churches.city,
  churchState: churches.state,
  churchCountry: churches.country,
};

type FlatRow = {
  id: number;
  date: string;
  scriptureReading: string | null;
  openingHymn: string | null;
  closingHymn: string | null;
  notes: string | null;
  sermonId: unknown; // sql``.as() infers as unknown
  sermonTitle: string;
  sermonDescription: string | null;
  churchId: unknown; // sql``.as() infers as unknown
  churchName: string;
  churchCity: string | null;
  churchState: string | null;
  churchCountry: string | null;
};

function shape(row: FlatRow) {
  return {
    id: row.id,
    date: row.date,
    scriptureReading: row.scriptureReading,
    openingHymn: row.openingHymn,
    closingHymn: row.closingHymn,
    notes: row.notes,
    sermon: { id: row.sermonId as number, title: row.sermonTitle, description: row.sermonDescription },
    church: { id: row.churchId as number, name: row.churchName, city: row.churchCity, state: row.churchState, country: row.churchCountry },
  };
}

function baseQuery() {
  return db
    .select(flatSelect)
    .from(sermonEvents)
    .innerJoin(sermons, eq(sermonEvents.sermonId, sermons.id))
    .innerJoin(churches, eq(sermonEvents.churchId, churches.id));
}

app.get('/', async (c) => {
  const sermonId = c.req.query('sermon_id') ? Number(c.req.query('sermon_id')) : undefined;
  const churchId = c.req.query('church_id') ? Number(c.req.query('church_id')) : undefined;

  const conditions = [eq(sermonEvents.userId, DEFAULT_USER_ID)];
  if (sermonId) conditions.push(eq(sermonEvents.sermonId, sermonId));
  if (churchId) conditions.push(eq(sermonEvents.churchId, churchId));

  const rows = await baseQuery().where(and(...conditions)).orderBy(desc(sermonEvents.date));
  return c.json(rows.map(shape));
});

app.post('/', async (c) => {
  const body = await c.req.json<{
    sermonId: number;
    churchId: number;
    date: string;
    scriptureReading?: string;
    openingHymn?: string;
    closingHymn?: string;
    notes?: string;
  }>();

  if (!body.sermonId || !body.churchId || !body.date) {
    return c.json({ error: 'sermonId, churchId, and date are required' }, 400);
  }

  const [inserted] = await db
    .insert(sermonEvents)
    .values({
      userId: DEFAULT_USER_ID,
      sermonId: body.sermonId,
      churchId: body.churchId,
      date: body.date,
      scriptureReading: body.scriptureReading?.trim() || null,
      openingHymn: body.openingHymn?.trim() || null,
      closingHymn: body.closingHymn?.trim() || null,
      notes: body.notes?.trim() || null,
    })
    .returning({ id: sermonEvents.id });

  const [full] = await baseQuery().where(eq(sermonEvents.id, inserted.id)).limit(1);
  return c.json(shape(full as FlatRow), 201);
});

app.put('/:id', async (c) => {
  const id = Number(c.req.param('id'));
  const body = await c.req.json<{
    sermonId?: number;
    churchId?: number;
    date?: string;
    scriptureReading?: string;
    openingHymn?: string;
    closingHymn?: string;
    notes?: string;
  }>();

  const [updated] = await db
    .update(sermonEvents)
    .set({
      sermonId: body.sermonId,
      churchId: body.churchId,
      date: body.date,
      scriptureReading: body.scriptureReading?.trim() || null,
      openingHymn: body.openingHymn?.trim() || null,
      closingHymn: body.closingHymn?.trim() || null,
      notes: body.notes?.trim() || null,
    })
    .where(and(eq(sermonEvents.id, id), eq(sermonEvents.userId, DEFAULT_USER_ID)))
    .returning({ id: sermonEvents.id });

  if (!updated) return c.json({ error: 'not found' }, 404);

  const [full] = await baseQuery().where(eq(sermonEvents.id, updated.id)).limit(1);
  return c.json(shape(full as FlatRow));
});

app.delete('/:id', async (c) => {
  const id = Number(c.req.param('id'));
  await db
    .delete(sermonEvents)
    .where(and(eq(sermonEvents.id, id), eq(sermonEvents.userId, DEFAULT_USER_ID)));
  return c.json({ ok: true });
});

export default app;
