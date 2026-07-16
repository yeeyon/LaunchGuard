import type { ResolutionStatus, ScanResult } from '@/types/domain';
import { loadScanIfConfigured } from '@/server/persistence/load';

const globalStore = globalThis as typeof globalThis & {
  __launchguardScans?: Map<string, ScanResult>;
};
const scans = globalStore.__launchguardScans ?? new Map<string, ScanResult>();
globalStore.__launchguardScans = scans;

export function saveScan(scan: ScanResult): ScanResult {
  scans.set(scan.id, scan);
  return scan;
}
export function getScan(id: string): ScanResult | undefined {
  return scans.get(id);
}
export async function getScanAsync(
  id: string,
): Promise<ScanResult | undefined> {
  const cached = scans.get(id);
  if (cached) return cached;
  const stored = await loadScanIfConfigured(id);
  if (stored) scans.set(id, stored);
  return stored;
}
export function updateFindingStatus(
  scanId: string,
  findingId: string,
  status: ResolutionStatus,
): ScanResult | undefined {
  const scan = scans.get(scanId);
  if (!scan) return undefined;
  scan.findings = scan.findings.map((item, index) =>
    index.toString() === findingId || item.externalId === findingId
      ? { ...item, resolutionStatus: status }
      : item,
  );
  scan.updatedAt = new Date().toISOString();
  scans.set(scanId, scan);
  return scan;
}
