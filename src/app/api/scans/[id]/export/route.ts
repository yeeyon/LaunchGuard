import { NextResponse } from 'next/server';
import { getScanAsync } from '@/server/store';
import type { ScanResult } from '@/types/domain';

function markdown(scan: ScanResult) {
  return [
    `# LaunchGuard report: ${scan.context.owner}/${scan.context.name}`,
    '',
    `**Readiness:** ${scan.score}/100 - ${scan.readinessStatus}`,
    `**Scanned:** ${scan.createdAt}`,
    '',
    scan.summary,
    '',
    '## Findings',
    ...scan.findings.map(
      (item) =>
        `### [${item.severity.toUpperCase()}] ${item.title}\n- File: ${item.filePath ?? 'repository-wide'}\n- Evidence: ${item.evidence}\n- Impact: ${item.deploymentImpact}\n- Remediation: ${item.remediation.join('; ')}`,
    ),
  ].join('\n');
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } },
) {
  const scan = await getScanAsync(params.id);
  if (!scan)
    return NextResponse.json(
      {
        error: {
          code: 'SCAN_NOT_FOUND',
          message: 'That scan is no longer available.',
        },
      },
      { status: 404 },
    );
  const format = new URL(request.url).searchParams.get('format') ?? 'json';
  if (format === 'md')
    return new NextResponse(markdown(scan), {
      headers: {
        'Content-Type': 'text/markdown; charset=utf-8',
        'Content-Disposition': `attachment; filename=launchguard-${scan.context.name}.md`,
      },
    });
  if (format === 'html') {
    const summary = escapeHtml(scan.summary);
    const report = escapeHtml(markdown(scan));
    return new NextResponse(
      `<html><head><title>LaunchGuard report</title><style>body{font:16px system-ui;max-width:900px;margin:40px auto;color:#172126}code{background:#eef2e9;padding:2px 4px}</style></head><body><h1>LaunchGuard report</h1><p>${summary}</p><h2>${scan.score}/100 - ${escapeHtml(scan.readinessStatus)}</h2><pre>${report}</pre></body></html>`,
      { headers: { 'Content-Type': 'text/html; charset=utf-8' } },
    );
  }
  return NextResponse.json({ scan });
}
