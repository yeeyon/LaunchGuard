import { describe, expect, it } from 'vitest';
import { calculateScore, deduplicateFindings, fingerprintFor } from './index';
import type { AnalyzerFinding } from '@/types/domain';

const base = (severity: AnalyzerFinding['severity']): AnalyzerFinding => ({
  externalId: 'x',
  source: 'deterministic',
  title: 'Same issue',
  category: 'build',
  severity,
  confidence: 1,
  evidence: 'same evidence',
  explanation: 'A clear explanation.',
  deploymentImpact: 'Impact',
  remediation: ['Fix'],
  verificationSteps: ['Verify'],
});
describe('scoring', () => {
  it('caps repeated severity deductions and maps status', () => {
    expect(
      calculateScore([
        base('critical'),
        base('critical'),
        base('critical'),
        base('critical'),
      ]),
    ).toEqual({ score: 40, status: 'Blocked' });
  });
  it('deduplicates by stable fingerprint', () => {
    expect(
      deduplicateFindings([
        base('low'),
        {
          ...base('high'),
          source: 'ai',
          explanation: 'A longer AI explanation',
        },
      ]),
    ).toHaveLength(1);
    expect(fingerprintFor(base('low'))).toHaveLength(16);
  });
});
