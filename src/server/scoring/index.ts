import { createHash } from 'node:crypto';
import type { AnalyzerFinding, Severity } from '@/types/domain';

const deductions: Record<Severity, number> = {
  critical: 20,
  high: 10,
  medium: 5,
  low: 2,
  info: 0,
};
export function fingerprintFor(
  finding: Pick<
    AnalyzerFinding,
    'category' | 'title' | 'filePath' | 'evidence'
  >,
): string {
  return createHash('sha256')
    .update(
      [
        finding.category,
        finding.title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, ' ')
          .trim(),
        finding.filePath ?? '',
        finding.evidence.toLowerCase().replace(/\s+/g, ' ').trim(),
      ].join('|'),
    )
    .digest('hex')
    .slice(0, 16);
}
export function deduplicateFindings(
  findings: AnalyzerFinding[],
): AnalyzerFinding[] {
  const map = new Map<string, AnalyzerFinding>();
  for (const item of findings) {
    const key = fingerprintFor(item);
    const existing = map.get(key);
    if (
      !existing ||
      (existing.source !== 'deterministic' &&
        item.source === 'deterministic') ||
      item.explanation.length > existing.explanation.length
    )
      map.set(key, item);
  }
  return [...map.values()];
}
export function calculateScore(findings: AnalyzerFinding[]): {
  score: number;
  status: 'Ready' | 'Needs attention' | 'High risk' | 'Blocked';
} {
  const bySeverity = new Map<Severity, number>();
  for (const item of findings)
    bySeverity.set(
      item.severity,
      Math.min(
        item.severity === 'critical' ? 3 : item.severity === 'high' ? 6 : 12,
        (bySeverity.get(item.severity) ?? 0) + 1,
      ),
    );
  const score = Math.max(
    0,
    100 -
      [...bySeverity.entries()].reduce(
        (sum, [severity, count]) => sum + deductions[severity] * count,
        0,
      ),
  );
  const status =
    score >= 90
      ? 'Ready'
      : score >= 75
        ? 'Needs attention'
        : score >= 50
          ? 'High risk'
          : 'Blocked';
  return { score, status };
}
