import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { relations, sql } from 'drizzle-orm';

export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  title: text('title'),
  homeChurch: text('home_church'),
  notes: text('notes'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
});

export const churches = sqliteTable('churches', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull().references(() => users.id),
  name: text('name').notNull(),
  city: text('city'),
  state: text('state'),
  country: text('country'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
});

export const sermons = sqliteTable('sermons', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull().references(() => users.id),
  title: text('title').notNull(),
  description: text('description'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
});

export const sermonEvents = sqliteTable('sermon_events', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull().references(() => users.id),
  sermonId: integer('sermon_id').notNull().references(() => sermons.id),
  churchId: integer('church_id').notNull().references(() => churches.id),
  date: text('date').notNull(), // ISO date YYYY-MM-DD (the Sabbath date)
  scriptureReading: text('scripture_reading'),
  openingHymn: text('opening_hymn'),
  closingHymn: text('closing_hymn'),
  notes: text('notes'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
});

export const usersRelations = relations(users, ({ many }) => ({
  churches: many(churches),
  sermons: many(sermons),
  sermonEvents: many(sermonEvents),
}));

export const churchesRelations = relations(churches, ({ one, many }) => ({
  user: one(users, { fields: [churches.userId], references: [users.id] }),
  sermonEvents: many(sermonEvents),
}));

export const sermonsRelations = relations(sermons, ({ one, many }) => ({
  user: one(users, { fields: [sermons.userId], references: [users.id] }),
  sermonEvents: many(sermonEvents),
}));

export const sermonEventsRelations = relations(sermonEvents, ({ one }) => ({
  user: one(users, { fields: [sermonEvents.userId], references: [users.id] }),
  sermon: one(sermons, { fields: [sermonEvents.sermonId], references: [sermons.id] }),
  church: one(churches, { fields: [sermonEvents.churchId], references: [churches.id] }),
}));
