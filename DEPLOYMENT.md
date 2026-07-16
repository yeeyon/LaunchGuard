# Deployment

## Local (PowerShell)

```powershell
npm ci
Copy-Item .env.example .env
npm run db:generate
npm run dev
```

The app runs in demo mode without a database. For PostgreSQL persistence, set `DATABASE_URL` to a Neon pooled connection and `DIRECT_URL` to its direct migration connection, then run `npm run db:deploy` and `npm run db:seed`.

## Vercel + Neon

1. Create a Neon PostgreSQL project and copy the pooled URL to `DATABASE_URL` and the direct URL to `DIRECT_URL`.
2. Import the repository into Vercel as a Next.js project.
3. Add `DATABASE_URL`, `DIRECT_URL`, `OPENAI_API_KEY` (optional), `OPENAI_MODEL`, `OPENAI_REASONING_EFFORT`, `GITHUB_TOKEN` (optional), and `NEXT_PUBLIC_APP_URL` in Vercel project settings.
4. Deploy. The build runs `prisma generate && next build`.
5. Run migrations from a trusted machine with `npm run db:deploy` before opening the public scan flow.

## Container

The Dockerfile is production multi-stage and runs as a non-root user. On this Windows workstation, use rootless Podman through Ubuntu WSL only:

```powershell
wsl -d Ubuntu-24.04 -u user -- podman build -t localhost/launchguard:dev .
wsl -d Ubuntu-24.04 -u user -- podman run --rm -p 3000:3000 --env-file .env localhost/launchguard:dev
```

For Compose, run `podman-compose` inside WSL from `/mnt/c/Users/User/Project/LaunchGuard`. Do not use Docker Desktop for this project.

## Rollback and smoke test

Redeploy the previous Vercel deployment, then verify `/api/health`, landing page, demo scan, report detail, Markdown export, and database connectivity. Treat any live model call as optional during rollback verification.
