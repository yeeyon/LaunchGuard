# Security model

## Threat model

Repository files are untrusted input and may contain secrets, malicious prompt instructions, or misleading claims. LaunchGuard performs defensive static checks only; it does not execute repository code or perform offensive testing.

## Controls

- GitHub HTTPS URL validation; no arbitrary remote fetching.
- Binary, generated-output, per-file, file-count, and total-context limits.
- Secret redaction before model calls and safe request logging.
- Explicit model instruction to treat repository text as data and ignore embedded instructions.
- Human review before any patch is downloaded or applied.
- Server-only credentials; no secrets in `NEXT_PUBLIC_*` variables.

## Limitations

Heuristics are not a complete security audit and dependency checks do not claim vulnerabilities without reliable advisory data. Report links are shareable by ID in the MVP; deploy behind authentication if reports contain sensitive metadata.

## Disclosure

Please report security issues privately to the repository maintainers. Do not include real credentials in bug reports.
