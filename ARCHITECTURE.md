# LaunchGuard architecture

```mermaid
flowchart LR
  Input[GitHub URL or bundled fixture] --> Collect[bounded ingestion]
  Collect --> Redact[secret redaction]
  Redact --> Manifest[repository manifest]
  Manifest --> Deterministic[modular analyzers]
  Manifest --> AI[optional GPT-5.6 structured analysis]
  Deterministic --> Merge[fingerprint + deduplicate]
  AI --> Merge
  Merge --> Score[transparent score]
  Score --> Store[in-memory demo or Prisma storage]
  Store --> Report[report, finding, export routes]
```

## Boundaries

- `src/server/ingestion` selects files and builds manifests without executing source.
- `src/server/analyzers` contains deterministic, independently testable checks.
- `src/server/scoring` owns fingerprints, deduplication, and score semantics.
- `src/lib/openai` receives redacted context only and validates structured output with Zod.
- `src/server/store` is the MVP storage seam; demo mode is credential-free, while Prisma is ready for PostgreSQL.
- `src/components` renders evidence and review actions; it never receives provider credentials.

## Extension points

Add new repository providers behind an ingestion interface, new analyzer modules behind `RepositoryAnalyzer`, and a durable repository implementation behind the store functions. GitHub pull requests and authentication are intentionally outside the first release.
