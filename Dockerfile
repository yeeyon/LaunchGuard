FROM docker.io/library/node:20-bookworm-slim AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM docker.io/library/node:20-bookworm-slim AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate && npm run build

FROM docker.io/library/node:20-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN groupadd --system --gid 1001 launchguard && useradd --system --uid 1001 --gid launchguard launchguard
COPY --from=builder --chown=launchguard:launchguard /app/.next/standalone ./
COPY --from=builder --chown=launchguard:launchguard /app/.next/static ./.next/static
COPY --from=builder --chown=launchguard:launchguard /app/fixtures ./fixtures
USER launchguard
EXPOSE 3000
ENV PORT=3000
CMD ["node", "server.js"]
