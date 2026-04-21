// Standalone migration runner — runs all pending migrations then exits.
// Usage: npm run migrate
// Note: migrations also run automatically on every server start.
import './db/index.js';
console.log('Migrations applied.');
