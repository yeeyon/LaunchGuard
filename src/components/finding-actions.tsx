'use client';

import { useState } from 'react';
import { Check, Clipboard, Download } from 'lucide-react';

export function FindingActions({
  scanId,
  findingId,
  instructions,
  patch,
}: {
  scanId: string;
  findingId: string;
  instructions: string;
  patch?: string;
}) {
  const [status, setStatus] = useState<'open' | 'reviewed' | 'resolved'>(
    'open',
  );
  const [copied, setCopied] = useState('');
  async function copy(value: string, label: string) {
    await navigator.clipboard?.writeText(value);
    setCopied(label);
    setTimeout(() => setCopied(''), 1500);
  }
  async function update(next: 'reviewed' | 'resolved') {
    const response = await fetch(`/api/scans/${scanId}/findings/${findingId}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ status: next }),
    });
    if (response.ok) setStatus(next);
  }
  return (
    <div className="mt-7 flex flex-wrap gap-2">
      <button
        onClick={() => copy(instructions, 'instructions')}
        className="focus-ring inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-2 text-xs text-slate-300 hover:border-white/30"
      >
        <Clipboard className="h-3.5 w-3.5" />{' '}
        {copied === 'instructions'
          ? 'Instructions copied'
          : 'Copy instructions'}
      </button>
      {patch && (
        <>
          <button
            onClick={() => copy(patch, 'patch')}
            className="focus-ring inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-2 text-xs text-slate-300 hover:border-white/30"
          >
            <Clipboard className="h-3.5 w-3.5" />{' '}
            {copied === 'patch' ? 'Patch copied' : 'Copy patch'}
          </button>
          <a
            className="focus-ring inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-2 text-xs text-slate-300 hover:border-white/30"
            href={`data:text/plain;charset=utf-8,${encodeURIComponent(patch)}`}
            download="launchguard-fix.patch"
          >
            <Download className="h-3.5 w-3.5" /> Download patch
          </a>
        </>
      )}
      <button
        onClick={() => update('reviewed')}
        className={`focus-ring inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs ${status === 'reviewed' ? 'border-signal-blue/40 bg-signal-blue/10 text-signal-blue' : 'border-white/10 text-slate-300 hover:border-white/30'}`}
      >
        <Check className="h-3.5 w-3.5" /> Mark reviewed
      </button>
      <button
        onClick={() => update('resolved')}
        className={`focus-ring inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-bold ${status === 'resolved' ? 'bg-signal-green text-graphite-950' : 'bg-white/10 text-white hover:bg-white/15'}`}
      >
        <Check className="h-3.5 w-3.5" /> Mark resolved
      </button>
    </div>
  );
}
