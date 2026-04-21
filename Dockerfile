# ============================================================
# Stage 1 — Build the Vue client
# ============================================================
FROM node:22-alpine AS client-build
WORKDIR /workspace

COPY package*.json ./
COPY client/package*.json ./client/
RUN npm ci --workspace=client --ignore-scripts

COPY client/ ./client/
RUN npm run build --workspace=client

# ============================================================
# Stage 2 — Compile the TypeScript server
# ============================================================
FROM node:22-alpine AS server-build
WORKDIR /workspace

COPY package*.json ./
COPY server/package*.json ./server/
# client/package.json needed so npm workspaces resolves correctly
COPY client/package*.json ./client/
RUN npm ci --workspace=server

COPY server/ ./server/
RUN npm run build --workspace=server

# ============================================================
# Stage 3 — Production image
# ============================================================
FROM node:22-alpine
WORKDIR /app

# Install production dependencies only
COPY package*.json ./
COPY server/package*.json ./server/
COPY client/package*.json ./client/
RUN npm ci --workspace=server --omit=dev --ignore-scripts

# Compiled server
COPY --from=server-build /workspace/server/dist ./server/dist

# Drizzle migration files (applied automatically on startup)
COPY --from=server-build /workspace/server/drizzle ./server/drizzle

# Built Vue app (served as static files by Hono)
COPY --from=client-build /workspace/client/dist ./client/dist

# Database is stored on a named volume — never baked into the image
VOLUME ["/data"]

ENV NODE_ENV=production
ENV PORT=3000
ENV DATABASE_PATH=/data/sermontracker.db

EXPOSE 3000

# Node 22 requires --experimental-sqlite for the built-in sqlite module.
# This flag is not needed on Node 23+.
CMD ["node", "--experimental-sqlite", "server/dist/index.js"]
