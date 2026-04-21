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
| `AUTH_MODE` | — | Set to `proxy` to enable Authentik header auth (see below) |

---

## nginx + Authentik reverse proxy

SermonTracker is designed to sit behind nginx with [Authentik](https://goauthentik.io/) handling
authentication. When `AUTH_MODE=proxy` the server trusts the identity headers that Authentik
injects after a successful login (`X-Authentik-Email`, `X-Authentik-Name`). Each unique email
address gets its own isolated data set — the first request from a new user automatically creates
their account.

### How it works

1. A request hits nginx for `sermons.example.com`.
2. nginx forwards the request to Authentik's outpost (`auth_request`). If the user is not logged
   in, Authentik redirects them to the login page.
3. Once authenticated, Authentik sets response headers (`X-Authentik-Email`, etc.) and nginx
   passes them through to the SermonTracker container.
4. SermonTracker's auth middleware reads `X-Authentik-Email`, finds or creates the matching user
   row, and scopes all database queries to that user's ID.

### Example nginx server block

Replace `sermons.example.com`, the SSL certificate paths, and the Authentik outpost URL with your
own values. The Authentik-specific `auth_request` lines mirror whatever you already use for your
other protected services.

```nginx
server {
    listen 443 ssl;
    server_name sermons.example.com;

    ssl_certificate     /etc/letsencrypt/live/sermons.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/sermons.example.com/privkey.pem;

    # Authentik forward-auth — delegates login to your Authentik instance.
    # Adjust the outpost URL to match your setup.
    location /outpost.goauthentik.io {
        proxy_pass https://authentik.example.com/outpost.goauthentik.io;
        proxy_set_header Host              authentik.example.com;
        proxy_set_header X-Original-URL    $scheme://$http_host$request_uri;
        proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        add_header       Set-Cookie        $auth_cookie;
        auth_request_set $auth_cookie      $upstream_http_set_cookie;
    }

    # Named location used for the 401 → login redirect
    location @goauthentik_proxy_signin {
        internal;
        add_header Set-Cookie $auth_cookie;
        return 302 /outpost.goauthentik.io/start?rd=$scheme://$http_host$request_uri;
    }

    location / {
        # Verify the session with Authentik before every request
        auth_request /outpost.goauthentik.io/auth/nginx;
        error_page 401 = @goauthentik_proxy_signin;

        # Capture and forward identity headers set by Authentik
        auth_request_set $authentik_email $upstream_http_x_authentik_email;
        auth_request_set $authentik_name  $upstream_http_x_authentik_name;

        proxy_pass http://sermontracker:3000;
        proxy_set_header Host              $host;
        proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Pass the identity to SermonTracker
        proxy_set_header X-Authentik-Email $authentik_email;
        proxy_set_header X-Authentik-Name  $authentik_name;
    }
}

# Redirect HTTP → HTTPS
server {
    listen 80;
    server_name sermons.example.com;
    return 301 https://$host$request_uri;
}
```

### Checklist

- `AUTH_MODE=proxy` is set in your `docker-compose.yml` environment (already included).
- SermonTracker's container is **not** exposed directly on a public port — traffic must go through
  nginx so the `X-Authentik-*` headers cannot be spoofed by external clients.
- In Authentik, create a **Proxy Provider** in forward-auth mode pointed at
  `https://sermons.example.com` and attach it to an Application + Outpost.
