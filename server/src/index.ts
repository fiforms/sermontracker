import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, extname } from 'node:path';
import churches from './routes/churches.js';
import sermons from './routes/sermons.js';
import events from './routes/events.js';
import profile from './routes/profile.js';
import { authMiddleware } from './middleware/auth.js';
import type { AppVariables } from './types.js';

// DB init — runs migrations and seeds default user on import
import './db/index.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

const app = new Hono<{ Variables: AppVariables }>();

app.use('*', logger());

// In development the client runs on a different origin (Vite :5173)
if (process.env.NODE_ENV !== 'production') {
  app.use('/api/*', cors({ origin: 'http://localhost:5173' }));
}

app.use('/api/*', authMiddleware);

app.route('/api/churches', churches);
app.route('/api/sermons', sermons);
app.route('/api/events', events);
app.route('/api/profile', profile);
app.get('/health', (c) => c.json({ ok: true }));

// Static file serving for production Docker.
// In dev, client/dist won't exist (Vite serves files itself on :5173).
// In production, the built Vue app lives next to the compiled server.
const PUBLIC_DIR = join(__dirname, '../../client/dist');

if (existsSync(PUBLIC_DIR)) {
  const MIME: Record<string, string> = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.webmanifest': 'application/manifest+json',
    '.png': 'image/png',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.woff2': 'font/woff2',
    '.woff': 'font/woff',
  };

  app.use('*', async (c, next) => {
    const reqPath = c.req.path === '/' ? '/index.html' : c.req.path;
    // Reject path traversal attempts
    if (reqPath.includes('..')) return next();
    const filePath = join(PUBLIC_DIR, reqPath);
    if (existsSync(filePath)) {
      const content = await readFile(filePath);
      return new Response(content, {
        headers: { 'Content-Type': MIME[extname(filePath)] ?? 'application/octet-stream' },
      });
    }
    return next();
  });

  // SPA fallback — let Vue Router handle client-side navigation
  app.get('*', async (c) => {
    const html = await readFile(join(PUBLIC_DIR, 'index.html'), 'utf-8');
    return c.html(html);
  });
}

const PORT = Number(process.env.PORT) || 3000;
console.log(`Server running on http://localhost:${PORT}`);
serve({ fetch: app.fetch, port: PORT });
