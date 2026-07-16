import { NextResponse } from 'next/server';
import { repositoryInputSchema } from '@/lib/validation/url';
import { createDemoScan } from '@/server/demo';
import { saveScan } from '@/server/store';
import {
  collectGithubRepository,
  GithubIngestionError,
} from '@/lib/github/client';
import { runRepositoryScan } from '@/server/scanning/run';
import { persistScanIfConfigured } from '@/server/persistence/save';

export async function POST(request: Request) {
  const streamRequested =
    new URL(request.url).searchParams.get('stream') === '1';
  if (streamRequested) {
    const body = await request.json().catch(() => ({}));
    const encoder = new TextEncoder();
    return new Response(
      new ReadableStream({
        async start(controller) {
          const emit = (value: unknown) =>
            controller.enqueue(encoder.encode(`${JSON.stringify(value)}\n`));
          try {
            const isDemo = body?.demo === true || !body?.repositoryUrl;
            let scan;
            if (isDemo)
              scan = saveScan(await createDemoScan((stage) => emit({ stage })));
            else {
              const parsed = repositoryInputSchema.safeParse(body);
              if (!parsed.success)
                throw new GithubIngestionError(
                  'INVALID_REPOSITORY_URL',
                  'Enter a public GitHub repository URL.',
                  400,
                );
              emit({ stage: 'reading' });
              const context = await collectGithubRepository(
                parsed.data.repositoryUrl,
                parsed.data.branch,
                parsed.data.target,
              );
              emit({ stage: 'detecting' });
              scan = saveScan(
                await runRepositoryScan(context, (stage) => emit({ stage })),
              );
            }
            await persistScanIfConfigured(scan);
            emit({
              done: true,
              scan: { id: scan.id, status: scan.status, aiMode: scan.aiMode },
            });
          } catch (error) {
            emit({
              error: {
                code:
                  error instanceof GithubIngestionError
                    ? error.code
                    : 'SCAN_FAILED',
                message:
                  error instanceof GithubIngestionError
                    ? error.message
                    : 'The scan could not be completed.',
              },
            });
          } finally {
            controller.close();
          }
        },
      }),
      {
        headers: {
          'Content-Type': 'application/x-ndjson; charset=utf-8',
          'Cache-Control': 'no-store',
        },
      },
    );
  }
  try {
    const body = await request.json().catch(() => ({}));
    const isDemo = body?.demo === true || !body?.repositoryUrl;
    if (!isDemo) {
      const parsed = repositoryInputSchema.safeParse(body);
      if (!parsed.success)
        return NextResponse.json(
          {
            error: {
              code: 'INVALID_REPOSITORY_URL',
              message: 'Enter a public GitHub repository URL.',
            },
          },
          { status: 400 },
        );
      const context = await collectGithubRepository(
        parsed.data.repositoryUrl,
        parsed.data.branch,
        parsed.data.target,
      );
      const scan = saveScan(await runRepositoryScan(context));
      await persistScanIfConfigured(scan);
      return NextResponse.json(
        { scan: { id: scan.id, status: scan.status, aiMode: scan.aiMode } },
        { status: 201 },
      );
    }
    const scan = saveScan(await createDemoScan());
    await persistScanIfConfigured(scan);
    return NextResponse.json(
      { scan: { id: scan.id, status: scan.status, aiMode: scan.aiMode } },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof GithubIngestionError)
      return NextResponse.json(
        { error: { code: error.code, message: error.message } },
        { status: error.status },
      );
    return NextResponse.json(
      {
        error: {
          code: 'SCAN_FAILED',
          message: 'The scan could not be completed. Try the demo again.',
        },
      },
      { status: 500 },
    );
  }
}
