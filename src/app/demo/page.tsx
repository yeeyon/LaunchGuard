import { redirect } from 'next/navigation';
import { createDemoScan } from '@/server/demo';
import { saveScan } from '@/server/store';

export const dynamic = 'force-dynamic';

export default async function DemoPage() {
  const scan = saveScan(await createDemoScan());
  redirect(`/scan/${scan.id}`);
}
