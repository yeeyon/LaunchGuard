import { describe, expect, it } from 'vitest';
import { aiAnalysisSchema } from './schema';

describe('AI schema', () => {
  it('rejects malformed model output', () => {
    expect(aiAnalysisSchema.safeParse({ findings: [] }).success).toBe(false);
  });
  it('accepts a complete structured result', () => {
    expect(
      aiAnalysisSchema.safeParse({
        repositorySummary: 'r',
        deploymentSummary: 'd',
        architectureObservations: [],
        findings: [],
        releaseBlockers: [],
        quickWins: [],
        deploymentChecklist: [],
      }).success,
    ).toBe(true);
  });
});
