import { Hono } from 'hono';
import { db } from '../db/index.js';
import { churches } from '../db/schema.js';
import { eq, and } from 'drizzle-orm';
import type { AppVariables } from '../types.js';

const app = new Hono<{ Variables: AppVariables }>();

app.get('/', async (c) => {
  const userId = c.get('userId');
  const rows = await db.select().from(churches).where(eq(churches.userId, userId));
  return c.json(rows);
});

app.post('/', async (c) => {
  const userId = c.get('userId');
  const body = await c.req.json<{ name: string; city?: string; state?: string; country?: string }>();
  if (!body.name?.trim()) return c.json({ error: 'name is required' }, 400);

  const [row] = await db
    .insert(churches)
    .values({
      userId,
      name: body.name.trim(),
      city: body.city?.trim() || null,
      state: body.state?.trim() || null,
      country: body.country?.trim() || null,
    })
    .returning();
  return c.json(row, 201);
});

app.put('/:id', async (c) => {
  const userId = c.get('userId');
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
    .where(and(eq(churches.id, id), eq(churches.userId, userId)))
    .returning();

  if (!row) return c.json({ error: 'not found' }, 404);
  return c.json(row);
});

app.delete('/:id', async (c) => {
  const userId = c.get('userId');
  const id = Number(c.req.param('id'));
  await db.delete(churches).where(and(eq(churches.id, id), eq(churches.userId, userId)));
  return c.json({ ok: true });
});

export default app;
