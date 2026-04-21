# Building SermonTracker

## Prerequisites

- Node.js 22.5+ (uses the built-in `node:sqlite` module)
- npm 10+

---

## Development

Install dependencies:

```bash
npm install
```

Start both the API server (port 3000) and the Vue dev server (port 5173) concurrently:

```bash
npm run dev
```

Open the app at **http://localhost:5173**. The Vite dev server proxies `/api/*` requests to the Hono server automatically.

### Schema changes

After editing `server/src/db/schema.ts`, generate a new migration file:

```bash
npm run generate --workspace=server
```

Migrations are applied automatically every time the server starts.

---

## Production build (no Docker)

Build the Vue client and compile the TypeScript server:

```bash
npm run build --workspace=client
npm run build --workspace=server
```

Run the compiled server, which also serves the built Vue app as static files:

```bash
cd server
NODE_ENV=production node --experimental-sqlite dist/index.js
```

The app will be available at **http://localhost:3000**.

Set `PORT=<n>` to use a different port. The database is created at
`server/sermontracker.db` by default; override with `DATABASE_PATH=/path/to/file.db`.

---

## Docker

### Prerequisites

```bash
# Add your user to the docker group (avoids needing sudo)
sudo usermod -aG docker $USER
newgrp docker

# Install the Compose plugin (if not already present)
sudo apt-get update && sudo apt-get install -y docker.io docker-compose-v2
```

### Build and run locally

```bash
docker compose build
docker compose up -d
```

The app will be available at **http://localhost:3000**.

View logs:

```bash
docker compose logs -f
```

Stop:

```bash
docker compose down
```

The database is stored in the `sermon-data` named Docker volume and survives
container restarts and image rebuilds.

### Deploy to a remote Docker server

**Option A — copy the image as a tar file:**

```bash
# Build and save
docker build -t sermontracker:latest .
docker save sermontracker:latest | gzip > sermontracker.tar.gz

# Copy to the server
scp sermontracker.tar.gz user@yourserver:~/

# On the server — load and run
docker load < sermontracker.tar.gz
docker run -d \
  --name sermontracker \
  --restart unless-stopped \
  -p 3000:3000 \
  -v sermon-data:/data \
  sermontracker:latest
```

**Option B — push to a private registry:**

```bash
docker build -t registry.example.com/sermontracker:latest .
docker push registry.example.com/sermontracker:latest

# On the server
docker pull registry.example.com/sermontracker:latest
docker run -d \
  --name sermontracker \
  --restart unless-stopped \
  -p 3000:3000 \
  -v sermon-data:/data \
  registry.example.com/sermontracker:latest
```

### Environment variables

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3000` | Port the server listens on |
| `DATABASE_PATH` | `/data/sermontracker.db` | Path to the SQLite database file |
| `NODE_ENV` | — | Set to `production` to disable development CORS headers |
