# Architecture decisions

## 2026-07-16 — Demo-first storage boundary

The demo must run without PostgreSQL, so the application uses a small storage interface with an in-memory implementation for credential-free local/demo runs and Prisma-backed persistence when `DATABASE_URL` is configured. This keeps the hackathon path reliable without hiding production persistence requirements.

## 2026-07-16 — Static analysis only

LaunchGuard never executes scanned repository code. Ingestion is limited to public GitHub content, bounded text files, and deterministic inspection plus optional model explanation.

## 2026-07-16 — Model configuration

The default remains `gpt-5.6-terra` from the brief. OpenAI documentation confirms `gpt-5.6` routes to `gpt-5.6-sol`, with `gpt-5.6-terra` as the lower-cost balance. Users can change `OPENAI_MODEL` without editing source.

## 2026-07-16 — Visual direction

The UI uses an industrial “release control room” direction: graphite surfaces, acid-green readiness signals, warm amber risk markers, monospace evidence, and restrained grid texture. The visual language is intentionally distinct from generic AI dashboard patterns.

## 2026-07-16 — Version pinning

Next.js 14.2.x and Node.js 20 are pinned/documented per the brief. Registry lookup was unavailable in the execution environment, so exact dependency versions are conservative, explicit pins rather than floating ranges.

## 2026-07-16 — Dependency audit note

`npm install` reports transitive audit findings and the required Next.js 14.2 line has a later security advisory. The build remains pinned to the requested brief version; upgrading beyond 14.2 should be a deliberate compatibility decision before production publication.
