# Devpost submission draft

## Project

**LaunchGuard** — Turn fragile repositories into deployment-ready releases.

## Inspiration

Small teams often discover missing environment variables, unsafe Docker defaults, broken CI ordering, or migration mistakes only after the deploy button is pressed. LaunchGuard turns that fragmented release review into one evidence-backed report.

## What it does

LaunchGuard accepts a public GitHub URL or a bundled broken repository, runs bounded deterministic analyzers, calculates a transparent readiness score, and optionally asks GPT-5.6 to connect findings across files. Every finding includes evidence, impact, remediation, verification, and reviewable patch candidates.

## How it was built

Next.js 14.2, TypeScript, React, Tailwind CSS, Zod, Prisma/PostgreSQL-ready storage, Vitest, Playwright, and the official OpenAI JavaScript SDK with the Responses API structured-output helper.

## GPT-5.6 and Codex

GPT-5.6 is used for redacted cross-file architecture analysis, prioritization, explanations, deployment instructions, and patch candidates. Deterministic code owns file selection, redaction, schema validation, analyzers, and scoring. Codex was used to plan the architecture, implement the stages, consult official OpenAI documentation, and verify the resulting artifacts. Before submitting, run `/feedback` in the Codex session where most core functionality was created and save the resulting session ID.

## Testing instructions

```powershell
npm ci
npm run lint
npm run typecheck
npm test
npm run build
```

Then run `npm run dev` and click **Run the broken-repo demo**. No credentials are needed for demo mode.

## Limitations and roadmap

Public GitHub scanning, durable PostgreSQL persistence, and live GPT-5.6 require configuration. Future releases can add authenticated GitHub access, pull-request workflows, more ecosystems, and organization-level retention controls.
