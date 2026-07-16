import { NextResponse } from 'next/server';

export function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'launchguard',
    demoMode: process.env.DEMO_MODE !== 'false',
    timestamp: new Date().toISOString(),
  });
}
