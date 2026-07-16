import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma/client';
import { fingerprintFor } from '@/server/scoring';
import type { ScanResult } from '@/types/domain';

const enumValue = (value: string) => value.replace('-', '_').toUpperCase();
const json = (value: unknown) =>
  JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;

export async function persistScanIfConfigured(scan: ScanResult): Promise<void> {
  if (!process.env.DATABASE_URL || !process.env.DIRECT_URL) return;
  try {
    await prisma.scan.create({
      data: {
        id: scan.id,
        repositoryUrl: scan.context.url,
        repositoryOwner: scan.context.owner,
        repositoryName: scan.context.name,
        branch: scan.context.branch,
        framework: scan.context.manifest.framework,
        packageManager: scan.context.manifest.packageManager,
        requestedTarget: scan.context.manifest.detectedTargets[0],
        detectedTargets: json(scan.context.manifest.detectedTargets),
        status: 'COMPLETE',
        score: scan.score,
        readinessStatus: scan.readinessStatus,
        summary: scan.summary,
        deploymentSummary: scan.deploymentSummary,
        isDemo: scan.context.source === 'demo',
        aiMode: scan.aiMode,
        aiModel: scan.aiModel,
        manifest: json(scan.context.manifest),
        findings: {
          create: scan.findings.map((item) => ({
            fingerprint: fingerprintFor(item),
            externalId: item.externalId,
            source: enumValue(item.source) as
              | 'DETERMINISTIC'
              | 'AI'
              | 'SEEDED_AI',
            title: item.title,
            category: enumValue(item.category) as never,
            severity: enumValue(item.severity) as never,
            confidence: item.confidence,
            filePath: item.filePath,
            lineStart: item.lineStart,
            lineEnd: item.lineEnd,
            evidence: item.evidence,
            explanation: item.explanation,
            deploymentImpact: item.deploymentImpact,
            remediation: json(item.remediation),
            verificationSteps: json(item.verificationSteps),
            patchSummary: item.patchCandidate?.summary,
            unifiedDiff: item.patchCandidate?.unifiedDiff,
          })),
        },
        checklistItems: {
          create: scan.deploymentChecklist.map((label, position) => ({
            label,
            position,
          })),
        },
      },
    });
  } catch {
    /* Demo and scan results remain usable through in-memory storage. */
  }
}
