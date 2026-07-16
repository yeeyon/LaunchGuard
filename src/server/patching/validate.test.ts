import { describe, expect, it } from 'vitest';
import { validateUnifiedDiff } from './validate';

describe('patch validation', () => {
  it('accepts non-empty diffs for contextual files', () => {
    expect(
      validateUnifiedDiff(
        '--- a/package.json\n+++ b/package.json\n@@\n+  "build": "next build"',
        ['package.json'],
      ),
    ).toBe(true);
  });
  it('rejects redacted or unrelated patches', () => {
    expect(
      validateUnifiedDiff(
        '--- a/package.json\n+++ b/package.json\n+[REDACTED]',
        ['package.json'],
      ),
    ).toBe(false);
    expect(
      validateUnifiedDiff('--- a/other.ts\n+++ b/other.ts\n+x', [
        'package.json',
      ]),
    ).toBe(false);
  });
});
