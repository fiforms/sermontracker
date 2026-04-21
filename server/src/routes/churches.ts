import { Hono } from 'hono';
import { db, DEFAULT_USER_ID } from '../db/index.js';
import { churches } from '../db/schema.js';
import { eq, and } from 'drizzle-orm';

const app = new Hono();

app.get('/', async (c) => {
  const rows = await db.select().from(churches).where(eq(churches.userId, DEFAULT_USER_ID));
  return c.json(rows);
});

app.post('/', async (c) => {
  const body = await c.req.json<{ name: string; city?: string; state?: string; country?: string }>();
  if (!body.name?.trim()) return c.json({ error: 'name is required' }, 400);

  const [row] = await db
    .insert(churches)
    .values({
      userId: DEFAULT_USER_ID,
      name: body.name.trim(),
      city: body.city?.trim() || null,
      state: body.state?.trim() || null,
      country: body.country?.trim() || null,
    })
    .returning();
  return c.json(row, 201);
});

app.put('/:id', async (c) => {
  const id = Number(c.req.param('id'));
  const body = await c.req.json<{ name?: string; city?: string; state?: string; country?: string }>();

  const [row] = await db
    .update(churches)
    .set({
      name: body.name?.trim(),
      city: body.city?.trim() || null,
      state: body.state?.trim() || null,
      country: body.country?.trim() || null,
    })
    .where(and(eq(churches.id, id), eq(churches.userId, DEFAULT_USER_ID)))
    .returning();

  if (!row) return c.json({ error: 'not found' }, 404);
  return c.json(row);
});

app.delete('/:id', async (c) => {
  const id = Number(c.req.param('id'));
  await db.delete(churches).where(and(eq(churches.id, id), eq(churches.userId, DEFAULT_USER_ID)));
  return c.json({ ok: true });
});

export default app;
