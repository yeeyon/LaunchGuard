# LaunchGuard — In-Depth Project Analysis

## Overview

**LaunchGuard** is a developer tool for the "last review before production." It accepts a public GitHub repository URL or a bundled deliberately broken Next.js fixture, performs bounded deterministic analysis, and returns a deployment-readiness score with evidence, impact, remediation, verification steps, checklists, exports, and reviewable patch candidates.

**Core Purpose:** Applications often work locally while production fails on missing environment variables, unsafe secrets, weak CI gates, broken Docker packaging, migration drift, or platform assumptions. LaunchGuard makes those risks visible before launch day.

---

## Architecture & Data Flow

```
GitHub URL or Demo Fixture
         ↓
Bounded Ingestion (file selection, size limits, safe errors)
         ↓
Secret Redaction (patterns + .env value masking)
         ↓
Repository Manifest (framework, targets, env vars, scripts, deps)
         ↓
┌───────────────────────┬───────────────────────┐
│ Deterministic Analyzers │ Optional GPT-5.6 AI   │
│ (9 modular checks)      │ (Responses API)      │
└───────────────────────┴───────────────────────┘
         ↓
Fingerprint-based Deduplication
         ↓
Transparent Scoring (critical=20, high=10, medium=5, low=2, with caps)
         ↓
Report Generation (JSON / Markdown / HTML / unified-diff patches)
```

---

## Technology Stack

| Layer           | Technology                                        |
| --------------- | ------------------------------------------------- |
| Framework       | Next.js 14.2.31 (App Router)                      |
| Language        | TypeScript 5.7.2                                  |
| Styling         | Tailwind CSS 3.4.16 + shadcn/ui patterns          |
| Database        | Prisma 6.19.3 + PostgreSQL (Neon) — optional      |
| AI              | OpenAI Responses API (gpt-5.6-terra default)      |
| Validation      | Zod 3.25.76                                       |
| Testing         | Vitest 2.1.8 (unit) + Playwright 1.55.1 (e2e)     |
| Package Manager | npm                                               |
| Container       | Multi-stage Dockerfile (non-root) — Podman on WSL |

---

## Screens & Routes

| Route                                  | Purpose                                             |
| -------------------------------------- | --------------------------------------------------- |
| `/`                                    | Landing page with intake                            |
| `/scan`                                | Repository URL intake form                          |
| `/demo`                                | One-click demo against `fixtures/broken-nextjs-app` |
| `/scan/[id]`                           | Scan report with score, findings, checklist         |
| `/scan/[id]/finding/[findingId]`       | Finding detail with evidence, patch, verification   |
| `/about`                               | Project info                                        |
| `/privacy`                             | Privacy policy                                      |
| `/docs`                                | Documentation                                       |
| `/api/health`                          | Health check endpoint                               |
| `/api/scans`                           | Create scan (POST)                                  |
| `/api/scans/[id]`                      | Get scan (GET)                                      |
| `/api/scans/[id]/export`               | Export report (format=md\|json\|html)               |
| `/api/scans/[id]/findings/[findingId]` | Get finding detail                                  |

---

## Analyzer Modules (9 Deterministic Checks)

### 1. Package Analyzer (`packageAnalyzer`)

- **Validates:** `package.json` parses, has `build` script (critical), `start` script (high), `typecheck`/`lint`/`test` scripts (medium)
- **Checks:** Lockfile present (high), no `latest` dependencies (medium)
- **Patch candidates:** Adds missing `build` script

### 2. Environment Analyzer (`environmentAnalyzer`)

- **Checks:** All `process.env.*` references documented in `.env.example`
- **Severity:** High for secrets/tokens/keys, medium for others
- **Detects:** `NEXT_PUBLIC_*` with secret-like names (critical), committed `.env` files (critical), secret-like values in source (critical)

### 3. Docker Analyzer (`dockerAnalyzer`)

- **Triggers:** When `Dockerfile` present
- **Checks:** `.dockerignore` exists (medium), non-root USER (high), multi-stage build (medium), pinned base image (high), no `.env` COPY (critical)

### 4. Next.js Analyzer (`nextAnalyzer`)

- **Triggers:** Framework detected as Next.js
- **Checks:** `output: standalone` for Docker (low), API route validation with Zod (high), client components reading server-only env (high)

### 5. TypeScript Analyzer (`typescriptAnalyzer`)

- **Triggers:** `tsconfig.json` present
- **Checks:** `strict: true` (medium)

### 6. CI/CD Analyzer (`ciAnalyzer`)

- **Triggers:** Always (checks for `.github/workflows/*.yml`)
- **Checks:** Workflow exists (high), runs build/typecheck/test (high/medium), deployment runs AFTER validation (critical), no `write-all` permissions (high)

### 7. Prisma Analyzer (`prismaAnalyzer`)

- **Triggers:** `prisma/schema.prisma` present
- **Checks:** No `prisma db push` in prod scripts (critical), `prisma generate`/`migrate` in scripts (high)

### 8. Documentation Analyzer (`documentationAnalyzer`)

- **Triggers:** Always
- **Checks:** README exists (medium), contains deploy/environment/test/troubleshoot sections (low each)

### 9. Vercel Analyzer (`vercelAnalyzer`)

- **Triggers:** Vercel target detected or Next.js framework
- **Checks:** No local filesystem writes outside `/tmp` (high)

### 10. AWS Analyzer (`awsAnalyzer`)

- **Triggers:** AWS target detected
- **Checks:** Hard-coded AWS keys (critical), overly broad IAM wildcards (high)

---

## Scoring System

```typescript
const deductions = {
  critical: 20, // capped at 3 findings
  high: 10, // capped at 6 findings
  medium: 5, // capped at 12 findings
  low: 2, // capped at 12 findings
  info: 0,
};

score = max(0, 100 - sum(deductions[severity] * cappedCount));
```

| Score Range | Status          |
| ----------- | --------------- |
| ≥ 90        | Ready           |
| 75–89       | Needs attention |
| 50–74       | High risk       |
| < 50        | Blocked         |

---

## Key Design Decisions (from DECISIONS.md)

1. **Demo-first storage boundary** — In-memory implementation for credential-free demo; Prisma for production PostgreSQL
2. **Static analysis only** — Never executes scanned code; bounded ingestion + deterministic inspection
3. **Model configuration** — Default `gpt-5.6-terra` (lower-cost balance); configurable via `OPENAI_MODEL`
4. **Visual direction** — Industrial "release control room": graphite surfaces, acid-green readiness, warm amber risk, monospace evidence
5. **Version pinning** — Next.js 14.2.x and Node.js 20 pinned explicitly
6. **Dependency audit note** — Transitive findings acknowledged; brief version kept deliberately

---

## Demo Fixture: `fixtures/broken-nextjs-app`

A deliberately broken Next.js app ("Parcel Pulse") with these intentional issues:

| File                           | Issues                                                                                                                    |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------- |
| `package.json`                 | Node 18.x (not 20), `react: latest`, missing `build`/`typecheck`/`lint`/`test` scripts, `prisma db push` in deploy script |
| `Dockerfile`                   | `FROM node:latest`, no `.dockerignore`, runs as root, single-stage, no `output: standalone`                               |
| `.github/workflows/deploy.yml` | `permissions: write-all`, deploys BEFORE install/build/test                                                               |
| `prisma/schema.prisma`         | Minimal schema (OK)                                                                                                       |
| `src/app/api/orders/route.ts`  | No Zod validation, writes to local filesystem (`writeFile`)                                                               |
| `next.config.mjs`              | Empty (no `output: standalone`)                                                                                           |
| `.env.example`                 | Missing many referenced env vars                                                                                          |
| `README.md`                    | Minimal (no deploy/env/test/troubleshoot sections)                                                                        |
| `vercel.json`                  | Present (triggers Vercel analyzer)                                                                                        |

---

## Storage Layer

**Interface:** `src/server/store.ts` with `getScanAsync`, `saveScanAsync`, `listScansAsync`

| Implementation    | Location                                     | Use Case                        |
| ----------------- | -------------------------------------------- | ------------------------------- |
| In-memory         | `src/server/store.ts` (default)              | Demo mode, local dev, hackathon |
| Prisma/PostgreSQL | `src/server/persistence/save.ts` + `load.ts` | Production with `DATABASE_URL`  |

Schema stores: metadata, redacted manifests, findings, patches, summaries, checklist state — NOT full repository checkout.

---

## Secret Redaction (Security Boundary)

`src/lib/security/redact.ts` — runs BEFORE any AI analysis:

```typescript
// Patterns redacted:
- sk-* (OpenAI keys)
- AKIA* (AWS keys)
- ghp_*, gho_*, ghs_*, ghr_* (GitHub tokens)
- Bearer tokens
- PEM private keys
- postgres:// URLs
- .env file values (all values masked)
- Any KEY/SECRET/TOKEN/PASSWORD/URL env-like assignments
```

AI receives only redacted excerpts (first 24 files, 8000 chars each).

---

## AI Analysis (Optional)

`src/lib/openai/analyze.ts` — uses OpenAI Responses API with Zod schema validation:

- **Input:** Redacted excerpts + deterministic findings
- **Output:** Structured analysis with summary, deployment summary, blockers, quick wins, checklist, additional findings
- **Fallback:** Seeded demo insight when no API key
- **Repair pass:** Re-prompts if structured output fails

---

## Export Formats

| Format   | Endpoint                             | Content                                      |
| -------- | ------------------------------------ | -------------------------------------------- |
| Markdown | `/api/scans/[id]/export?format=md`   | Full report with findings, evidence, patches |
| JSON     | `/api/scans/[id]/export?format=json` | Raw `ScanResult` object                      |
| HTML     | `/api/scans/[id]/export?format=html` | Printable single-page report                 |

---

## Verification Commands

```bash
npm run format:check   # Prettier
npm run lint           # ESLint
npm run typecheck      # tsc --noEmit
npm test               # Vitest unit tests
npm run test:e2e       # Playwright Chromium
npm run build          # Prisma generate + next build
```

---

## Container / Deployment

**Local (Podman on WSL):**

```bash
wsl -d Ubuntu-24.04 -u user -- podman build -t localhost/launchguard:dev .
wsl -d Ubuntu-24.04 -u user -- podman run --rm -p 3000:3000 --env-file .env localhost/launchguard:dev
```

**Vercel + Neon:**

1. Create Neon PostgreSQL → copy pooled URL to `DATABASE_URL`, direct to `DIRECT_URL`
2. Import repo to Vercel as Next.js project
3. Add env vars: `DATABASE_URL`, `DIRECT_URL`, `OPENAI_API_KEY`, `OPENAI_MODEL`, `OPENAI_REASONING_EFFORT`, `GITHUB_TOKEN`, `NEXT_PUBLIC_APP_URL`
4. Deploy (build runs `prisma generate && next build`)
5. Run `npm run db:deploy` from trusted machine before public scan flow

---

## Security & Limitations

- **Defensive static analysis only** — not a full security audit or vulnerability database
- **Never executes** repository code
- **Never follows** instructions inside repository files (prompt injection defense)
- **Never changes** a GitHub repository
- **Secrets redacted** before any AI analysis
- Read `SECURITY.md` and `PRIVACY.md` before scanning sensitive code

---

## Extension Points

1. **New repository providers** — implement ingestion interface
2. **New analyzers** — implement `RepositoryAnalyzer` interface
3. **Durable storage** — implement store functions behind `src/server/store.ts`

GitHub PRs and authentication intentionally outside first release.

---

## Hackathon Materials

- `DEMO_SCRIPT.md` — demo flow script
- `DEVPOST_SUBMISSION.md` — Devpost submission content
- `CODEX_BUILD_LOG.md` — build log
- `DECISIONS.md` — architecture decisions log

---

## License

MIT — see `LICENSE`
