import { Hono } from 'hono';
import { db } from '../db/index.js';
import { users } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import type { AppVariables } from '../types.js';

const app = new Hono<{ Variables: AppVariables }>();

type UserRow = typeof users.$inferSelect;
function profileResponse(user: UserRow) {
  return {
    name: user.name,
    email: user.email,
    title: user.title,
    homeChurch: user.homeChurch,
    notes: user.notes,
    emailEditable: process.env.AUTH_MODE !== 'proxy',
    appPortalUrl: process.env.APP_PORTAL_URL || null,
  };
}

app.get('/', async (c) => {
  const userId = c.get('userId');
  const [user] = await db.select().from(users).where(eq(users.id, userId));
  if (!user) return c.json({ error: 'not found' }, 404);
  return c.json(profileResponse(user));
});

app.put('/', async (c) => {
  const userId = c.get('userId');
  const body = await c.req.json<{
    name?: string;
    email?: string;
    title?: string;
    homeChurch?: string;
    notes?: string;
  }>();

  const update: Partial<typeof users.$inferInsert> = {
    name: body.name?.trim() || undefined,
    title: body.title?.trim() || null,
    homeChurch: body.homeChurch?.trim() || null,
    notes: body.notes?.trim() || null,
  };

  if (process.env.AUTH_MODE !== 'proxy' && body.email?.trim()) {
    update.email = body.email.trim();
  }

  if (update.name !== undefined && !update.name) {
    return c.json({ error: 'name is required' }, 400);
  }

  const [row] = await db.update(users).set(update).where(eq(users.id, userId)).returning();
  return c.json(profileResponse(row));
});

export default app;
