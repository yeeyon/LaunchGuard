import { NextResponse } from 'next/server';
import { getScan, updateFindingStatus } from '@/server/store';
import { persistFindingStatusIfConfigured } from '@/server/persistence/load';
import { z } from 'zod';

const statusSchema = z.object({
  status: z.enum(['open', 'reviewed', 'resolved']),
});

export async function PATCH(
  request: Request,
  { params }: { params: { id: string; findingId: string } },
) {
  const parsed = statusSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json(
      {
        error: {
          code: 'INVALID_STATUS',
          message: 'Use open, reviewed, or resolved.',
        },
      },
      { status: 400 },
    );
  const scan = updateFindingStatus(
    params.id,
    params.findingId,
    parsed.data.status,
  );
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
  const finding = getScan(params.id)?.findings.find(
    (item, index) =>
      index.toString() === params.findingId ||
      item.externalId === params.findingId,
  );
  if (finding)
    await persistFindingStatusIfConfigured(
      params.id,
      finding,
      parsed.data.status,
    );
  return NextResponse.json({ scan });
}
