import { Hono } from 'hono';
import { db } from '../db/index.js';
import { sermons, sermonEvents } from '../db/schema.js';
import { eq, and, notInArray } from 'drizzle-orm';
import type { AppVariables } from '../types.js';

const app = new Hono<{ Variables: AppVariables }>();

app.get('/', async (c) => {
  const userId = c.get('userId');
  const rows = await db.select().from(sermons).where(eq(sermons.userId, userId));
  return c.json(rows);
});

// Sermons never preached at a specific church
app.get('/not-at-church/:churchId', async (c) => {
  const userId = c.get('userId');
  const churchId = Number(c.req.param('churchId'));

  const preached = await db
    .selectDistinct({ id: sermonEvents.sermonId })
    .from(sermonEvents)
    .where(and(eq(sermonEvents.churchId, churchId), eq(sermonEvents.userId, userId)));

  const preachedIds = preached.map((r) => r.id);

  const rows =
    preachedIds.length > 0
      ? await db
          .select()
          .from(sermons)
          .where(and(eq(sermons.userId, userId), notInArray(sermons.id, preachedIds)))
      : await db.select().from(sermons).where(eq(sermons.userId, userId));

  return c.json(rows);
});

app.post('/', async (c) => {
  const userId = c.get('userId');
  const body = await c.req.json<{ title: string; description?: string }>();
  if (!body.title?.trim()) return c.json({ error: 'title is required' }, 400);

  const [row] = await db
    .insert(sermons)
    .values({
      userId,
      title: body.title.trim(),
      description: body.description?.trim() || null,
    })
    .returning();
  return c.json(row, 201);
});

app.put('/:id', async (c) => {
  const userId = c.get('userId');
  const id = Number(c.req.param('id'));
  const body = await c.req.json<{ title?: string; description?: string }>();

  const [row] = await db
    .update(sermons)
    .set({
      title: body.title?.trim(),
      description: body.description?.trim() || null,
    })
    .where(and(eq(sermons.id, id), eq(sermons.userId, userId)))
    .returning();

  if (!row) return c.json({ error: 'not found' }, 404);
  return c.json(row);
});

app.delete('/:id', async (c) => {
  const userId = c.get('userId');
  const id = Number(c.req.param('id'));
  await db.delete(sermons).where(and(eq(sermons.id, id), eq(sermons.userId, userId)));
  return c.json({ ok: true });
});

export default app;
