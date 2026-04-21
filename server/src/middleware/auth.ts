import type { MiddlewareHandler } from 'hono';
import type { AppVariables } from '../types.js';
import { DEFAULT_USER_ID, findOrCreateUser } from '../db/index.js';

// When AUTH_MODE=proxy the app trusts headers forwarded by nginx+Authentik.
// Any other value (or unset) falls back to the hardcoded dev user (id=1).
export const authMiddleware: MiddlewareHandler<{ Variables: AppVariables }> = async (c, next) => {
  if (process.env.AUTH_MODE !== 'proxy') {
    c.set('userId', DEFAULT_USER_ID);
    return next();
  }

  const email = c.req.header('X-Authentik-Email');
  if (!email) return c.json({ error: 'Unauthorized' }, 401);

  const name =
    c.req.header('X-Authentik-Name') ||
    c.req.header('X-Authentik-Username') ||
    email.split('@')[0];

  const userId = await findOrCreateUser(email, name);
  c.set('userId', userId);
  return next();
};
