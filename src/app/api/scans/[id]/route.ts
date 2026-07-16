import { NextResponse } from 'next/server';
import { getScanAsync } from '@/server/store';

export async function GET(_: Request, { params }: { params: { id: string } }) {
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
  return NextResponse.json(
    { scan },
    { headers: { 'Cache-Control': 'private, no-store' } },
  );
}
