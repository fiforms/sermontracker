# SermonTracker

A personal Progressive Web App for pastors who preach at multiple churches.
Log every service — sermon, location, scripture, and hymns — then query your
history to plan where to preach next.

---

## Features

- **Log a service** — record the sermon title, church, date (Sabbath),
  scripture reading, and opening/closing hymn numbers in one form. Add a new
  sermon title or church on the spot without leaving the page.
- **Full history** — browse every service you've logged, with a live text
  filter to find entries quickly. Edit or delete any entry.
- **Smart queries** — three built-in search modes:
  - *Where did I preach sermon X?* — see every location a sermon has been used
  - *What sermons have I preached at church Y?* — full history for a location
  - *What sermons have I never preached at church Y?* — find fresh material for
    an upcoming visit
- **Manage lists** — add, edit, and delete your church and sermon libraries.
  Each sermon shows how many times it has been preached.
- **PWA** — installable on your phone's home screen, works offline once loaded.
- **Mobile-first** — bottom tab navigation, touch-friendly forms, responsive
  layout.
- **Multi-user ready** — the data model includes a `user_id` on every record so
  authentication can be added later without a schema migration.

---

## Tech stack

| Layer | Technology |
|---|---|
| Server | [Hono](https://hono.dev/) on Node.js |
| Database | SQLite via Node's built-in `node:sqlite` module |
| ORM / migrations | [Drizzle ORM](https://orm.drizzle.team/) |
| Client | [Vue 3](https://vuejs.org/) + [Pinia](https://pinia.vuejs.org/) + [Vue Router](https://router.vuejs.org/) |
| Build tool | [Vite](https://vitejs.dev/) with [vite-plugin-pwa](https://vite-pwa-org.netlify.app/) |
| Packaging | Docker (single container, multi-stage build) |

---

## Quick start

```bash
npm install
npm run dev
```

Open **http://localhost:5173**.

For full build and deployment instructions — including Docker — see [BUILDING.md](BUILDING.md).

---

## Data model

```
users
 └── churches      (name, city, state, country)
 └── sermons       (title, description)
 └── sermon_events (date, sermon → sermons, church → churches,
                    scripture_reading, opening_hymn, closing_hymn, notes)
```

A `sermon_event` is a single service: one sermon preached at one church on one
date. All other fields are optional.

# Online Demo

You can find a working demo of this software at https://sermontracker.pastordaniel.net/ (Log in using your google account)