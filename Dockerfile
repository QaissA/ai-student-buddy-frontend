# ─── Build stage ──────────────────────────────────────────────────────────────
# Compiles the Angular SPA to static files (production config by default per angular.json).
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
# defaultConfiguration is "production" → emits to dist/frontend/browser
RUN npm run build

# ─── Serve stage ──────────────────────────────────────────────────────────────
# Caddy acts as the public edge: serves the SPA AND reverse-proxies the APIs.
# Routing + TLS live in the mounted Caddyfile; this image only bakes the static build.
FROM caddy:2-alpine

# Static SPA served from /srv/www (see Caddyfile). The application builder nests
# browser assets under /browser.
COPY --from=builder /app/dist/frontend/browser /srv/www

EXPOSE 80 443
