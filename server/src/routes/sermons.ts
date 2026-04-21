import { Hono } from 'hono';
import { db, DEFAULT_USER_ID } from '../db/index.js';
import { sermons, sermonEvents } from '../db/schema.js';
import { eq, and, notInArray } from 'drizzle-orm';

const app = new Hono();

app.get('/', async (c) => {
  const rows = await db.select().from(sermons).where(eq(sermons.userId, DEFAULT_USER_ID));
  return c.json(rows);
});

// Sermons never preached at a specific church
app.get('/not-at-church/:churchId', async (c) => {
  const churchId = Number(c.req.param('churchId'));

  const preached = await db
    .selectDistinct({ id: sermonEvents.sermonId })
    .from(sermonEvents)
    .where(and(eq(sermonEvents.churchId, churchId), eq(sermonEvents.userId, DEFAULT_USER_ID)));

  const preachedIds = preached.map((r) => r.id);

  const rows =
    preachedIds.length > 0
      ? await db
          .select()
          .from(sermons)
          .where(and(eq(sermons.userId, DEFAULT_USER_ID), notInArray(sermons.id, preachedIds)))
      : await db.select().from(sermons).where(eq(sermons.userId, DEFAULT_USER_ID));

  return c.json(rows);
});

app.post('/', async (c) => {
  const body = await c.req.json<{ title: string; description?: string }>();
  if (!body.title?.trim()) return c.json({ error: 'title is required' }, 400);

  const [row] = await db
    .insert(sermons)
    .values({
      userId: DEFAULT_USER_ID,
      title: body.title.trim(),
      description: body.description?.trim() || null,
    })
    .returning();
  return c.json(row, 201);
});

app.put('/:id', async (c) => {
  const id = Number(c.req.param('id'));
  const body = await c.req.json<{ title?: string; description?: string }>();

  const [row] = await db
    .update(sermons)
    .set({
      title: body.title?.trim(),
      description: body.description?.trim() || null,
    })
    .where(and(eq(sermons.id, id), eq(sermons.userId, DEFAULT_USER_ID)))
    .returning();

  if (!row) return c.json({ error: 'not found' }, 404);
  return c.json(row);
});

app.delete('/:id', async (c) => {
  const id = Number(c.req.param('id'));
  await db.delete(sermons).where(and(eq(sermons.id, id), eq(sermons.userId, DEFAULT_USER_ID)));
  return c.json({ ok: true });
});

export default app;
