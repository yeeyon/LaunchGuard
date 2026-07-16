import { prisma } from '@/lib/prisma/client';
import { fingerprintFor } from '@/server/scoring';
import type {
  RepositoryManifest,
  ResolutionStatus,
  ScanResult,
} from '@/types/domain';

const source = (value: string) =>
  value === 'SEEDED_AI'
    ? ('seeded-ai' as const)
    : (value.toLowerCase() as 'deterministic' | 'ai');

export async function loadScanIfConfigured(
  id: string,
): Promise<ScanResult | undefined> {
  if (!process.env.DATABASE_URL || !process.env.DIRECT_URL) return undefined;
  try {
    const record = await prisma.scan.findUnique({
      where: { id },
      include: {
        findings: { orderBy: { createdAt: 'asc' } },
        checklistItems: { orderBy: { position: 'asc' } },
      },
    });
    if (!record || !record.manifest) return undefined;
    const manifest = record.manifest as unknown as RepositoryManifest;
    const findings = record.findings.map((item) => ({
      externalId: item.externalId ?? item.id,
      source: source(item.source),
      title: item.title,
      category:
        item.category.toLowerCase() as ScanResult['findings'][number]['category'],
      severity:
        item.severity.toLowerCase() as ScanResult['findings'][number]['severity'],
      confidence: item.confidence,
      filePath: item.filePath ?? undefined,
      lineStart: item.lineStart ?? undefined,
      lineEnd: item.lineEnd ?? undefined,
      evidence: item.evidence ?? '',
      explanation: item.explanation,
      deploymentImpact: item.deploymentImpact ?? '',
      remediation: (item.remediation as string[] | null) ?? [],
      verificationSteps: (item.verificationSteps as string[] | null) ?? [],
      patchCandidate: item.unifiedDiff
        ? {
            summary: item.patchSummary ?? 'Reviewable patch',
            unifiedDiff: item.unifiedDiff,
          }
        : undefined,
      resolutionStatus: item.resolutionStatus.toLowerCase() as ResolutionStatus,
    }));
    return {
      id: record.id,
      status: record.status.toLowerCase() as ScanResult['status'],
      context: {
        source: record.isDemo ? 'demo' : 'github',
        url: record.repositoryUrl ?? undefined,
        owner: record.repositoryOwner ?? 'unknown',
        name: record.repositoryName,
        branch: record.branch ?? manifest.branch,
        files: [],
        manifest,
      },
      findings,
      score: record.score ?? 0,
      readinessStatus: (record.readinessStatus ??
        'Blocked') as ScanResult['readinessStatus'],
      summary: record.summary ?? '',
      deploymentSummary: record.deploymentSummary ?? '',
      releaseBlockers: findings
        .filter((item) => item.severity === 'critical')
        .map((item) => item.title),
      quickWins: findings
        .filter((item) => item.severity === 'medium' || item.severity === 'low')
        .slice(0, 4)
        .map((item) => item.title),
      deploymentChecklist: record.checklistItems.map((item) => item.label),
      aiMode: (record.aiMode?.toLowerCase().replace('_', '-') ??
        'deterministic') as ScanResult['aiMode'],
      aiModel: record.aiModel ?? undefined,
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString(),
    };
  } catch {
    return undefined;
  }
}

export async function persistFindingStatusIfConfigured(
  scanId: string,
  finding: ScanResult['findings'][number],
  status: ResolutionStatus,
): Promise<void> {
  if (!process.env.DATABASE_URL || !process.env.DIRECT_URL) return;
  try {
    await prisma.finding.update({
      where: {
        scanId_fingerprint: { scanId, fingerprint: fingerprintFor(finding) },
      },
      data: {
        resolutionStatus: status.toUpperCase() as
          | 'OPEN'
          | 'REVIEWED'
          | 'RESOLVED',
      },
    });
  } catch {
    /* The in-memory report remains usable if the database is unavailable. */
  }
}
