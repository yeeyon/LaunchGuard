import { describe, expect, it } from 'vitest';
import { createDemoScan } from '@/server/demo';
import { runAnalyzers } from './index';

describe('demo analyzer slice', () => {
  it('finds the fixture blockers and keeps a reviewable patch', async () => {
    const scan = await createDemoScan();
    const titles = scan.findings.map((item) => item.title);
    expect(titles).toContain('Production build script is missing');
    expect(titles).toContain('Container runs as root');
    expect(
      scan.findings.some((item) =>
        item.patchCandidate?.unifiedDiff.includes('--- a/package.json'),
      ),
    ).toBe(true);
  });
  it('runs analyzers against a minimal context', async () => {
    const scan = await createDemoScan();
    const findings = await runAnalyzers(scan.context);
    expect(findings.length).toBeGreaterThan(5);
  });
});
