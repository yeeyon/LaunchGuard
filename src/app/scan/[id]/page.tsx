import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ReportView } from '@/components/report-view';
import { getScanAsync } from '@/server/store';

export const dynamic = 'force-dynamic';

export default async function ScanPage({ params }: { params: { id: string } }) {
  const scan = await getScanAsync(params.id);
  if (!scan) notFound();
  return <ReportView scan={scan} />;
}
