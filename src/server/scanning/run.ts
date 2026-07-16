import { randomUUID } from 'node:crypto';
import { runLiveAIAnalysis } from '@/lib/openai/analyze';
import { runAnalyzers } from '@/server/analyzers';
import { validateUnifiedDiff } from '@/server/patching/validate';
import { calculateScore, deduplicateFindings } from '@/server/scoring';
import type { RepositoryContext, ScanResult } from '@/types/domain';

export async function runRepositoryScan(
  context: RepositoryContext,
  onStage?: (stage: string) => void,
): Promise<ScanResult> {
  onStage?.('deterministic');
  const deterministic = await runAnalyzers(context);
  onStage?.('redacting');
  onStage?.('ai');
  const ai = await runLiveAIAnalysis(context, deterministic);
  onStage?.('patches');
  const aiFindings = (ai?.findings ?? []).map((item) => ({
    ...item,
    source: 'ai' as const,
    patchCandidate:
      item.patchCandidate &&
      validateUnifiedDiff(
        item.patchCandidate.unifiedDiff,
        context.files.map((file) => file.path),
      )
        ? item.patchCandidate
        : undefined,
  }));
  onStage?.('scoring');
  const findings = deduplicateFindings([...deterministic, ...aiFindings]);
  const readiness = calculateScore(findings);
  const now = new Date().toISOString();
  const scan: ScanResult = {
    id: randomUUID(),
    status: 'complete',
    context,
    findings,
    score: readiness.score,
    readinessStatus: readiness.status,
    summary:
      ai?.repositorySummary ??
      `LaunchGuard found ${findings.length} deployment-readiness findings in ${context.owner}/${context.name}.`,
    deploymentSummary:
      ai?.deploymentSummary ??
      'Review critical and high findings, apply changes in a local branch, and rerun the full release validation sequence.',
    releaseBlockers:
      ai?.releaseBlockers ??
      findings
        .filter((item) => item.severity === 'critical')
        .map((item) => item.title),
    quickWins:
      ai?.quickWins ??
      findings
        .filter((item) => ['medium', 'low'].includes(item.severity))
        .slice(0, 4)
        .map((item) => item.title),
    deploymentChecklist: ai?.deploymentChecklist ?? [
      'Document runtime environment variables.',
      'Run lint, type-check, tests, and build in CI.',
      'Review database migration and rollback strategy.',
      'Verify the target platform health endpoint.',
    ],
    aiMode: ai ? 'live' : 'deterministic',
    aiModel: ai ? process.env.OPENAI_MODEL || 'gpt-5.6-terra' : undefined,
    createdAt: now,
    updatedAt: now,
  };
  onStage?.('finalizing');
  return scan;
}
