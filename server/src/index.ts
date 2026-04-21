import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import churches from './routes/churches.js';
import sermons from './routes/sermons.js';
import events from './routes/events.js';

// DB init (runs migrations on import)
import './db/index.js';

const app = new Hono();

app.use('*', logger());
app.use('/api/*', cors({ origin: 'http://localhost:5173' }));

app.route('/api/churches', churches);
app.route('/api/sermons', sermons);
app.route('/api/events', events);

app.get('/health', (c) => c.json({ ok: true }));

const PORT = Number(process.env.PORT) || 3000;
console.log(`Server running on http://localhost:${PORT}`);

serve({ fetch: app.fetch, port: PORT });
