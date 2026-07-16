import fs from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { buildManifest } from '@/server/ingestion/manifest';
import { filterRepositoryFiles } from '@/server/ingestion/filter';
import { deduplicateFindings, calculateScore } from '@/server/scoring';
import { runAnalyzers } from '@/server/analyzers';
import type {
  RepositoryContext,
  RepositoryFile,
  ScanResult,
} from '@/types/domain';

async function walk(
  directory: string,
  root = directory,
): Promise<RepositoryFile[]> {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const files: RepositoryFile[] = [];
  for (const entry of entries) {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await walk(full, root)));
    else {
      const content = await fs.readFile(full, 'utf8');
      files.push({
        path: path.relative(root, full).replaceAll('\\', '/'),
        content,
        size: Buffer.byteLength(content),
        language: path.extname(entry.name).slice(1),
      });
    }
  }
  return files;
}

export async function createDemoScan(
  onStage?: (stage: string) => void,
): Promise<ScanResult> {
  onStage?.('reading');
  const root = path.join(process.cwd(), 'fixtures', 'broken-nextjs-app');
  const files = filterRepositoryFiles(await walk(root), {
    maxFiles: 250,
    maxFileBytes: 100_000,
    maxTotalBytes: 1_500_000,
  });
  onStage?.('detecting');
  const base = {
    source: 'demo' as const,
    owner: 'launchguard',
    name: 'broken-nextjs-app',
    branch: 'main',
    files,
  };
  const manifest = buildManifest(base);
  const context: RepositoryContext = { ...base, manifest };
  onStage?.('deterministic');
  const deterministic = deduplicateFindings(await runAnalyzers(context));
  onStage?.('redacting');
  onStage?.('ai');
  const seeded = deterministic.length
    ? [
        {
          ...deterministic[0],
          source: 'seeded-ai' as const,
          externalId: 'seeded-ai-architecture',
          title: 'The release path has no safe validation gate',
          category: 'cicd' as const,
          severity: 'high' as const,
          confidence: 0.87,
          filePath: '.github/workflows/deploy.yml',
          evidence:
            'Seeded GPT-5.6 demo insight: deployment is invoked before project validation.',
          explanation:
            'The workflow couples a production deploy with an incomplete validation sequence. A small ordering change creates a safer release boundary.',
          deploymentImpact:
            'Broken or untyped code can be promoted before the workflow proves it is releasable.',
          remediation: [
            'Split validation and deployment into dependent jobs.',
            'Require build, type-check, and test success before deploy.',
          ],
          verificationSteps: [
            'Break a test and verify the deploy job is skipped.',
          ],
        },
      ]
    : [];
  const findings = deduplicateFindings([...deterministic, ...seeded]);
  onStage?.('scoring');
  const score = calculateScore(findings);
  onStage?.('patches');
  const now = new Date().toISOString();
  const scan = {
    id: randomUUID(),
    status: 'complete' as const,
    context,
    findings,
    score: score.score,
    readinessStatus: score.status,
    summary: `LaunchGuard found ${findings.length} release risks in the bundled Next.js fixture. The biggest gaps are an unsafe CI gate, exposed configuration, and a production container that needs hardening.`,
    deploymentSummary:
      'This repository is not ready for a confident production launch yet. Fix the critical and high findings, then rerun the validation gates.',
    releaseBlockers: findings
      .filter((item) => item.severity === 'critical')
      .map((item) => item.title),
    quickWins: findings
      .filter((item) => item.severity === 'low' || item.severity === 'medium')
      .slice(0, 4)
      .map((item) => item.title),
    deploymentChecklist: [
      'Rotate and remove secret-like values.',
      'Document every runtime environment variable.',
      'Run install, lint, type-check, test, and build in CI.',
      'Use reviewed Prisma migrations in production.',
      'Build a minimal non-root runtime image.',
    ],
    aiMode: 'seeded' as const,
    aiModel: 'gpt-5.6-terra (seeded demo)',
    createdAt: now,
    updatedAt: now,
  };
  onStage?.('finalizing');
  return scan;
}
