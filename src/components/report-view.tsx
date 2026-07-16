'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Check,
  ChevronRight,
  Clipboard,
  Download,
  FileCode2,
  Filter,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import type { ScanResult, Severity } from '@/types/domain';

const severityStyles: Record<Severity, string> = {
  critical: 'border-signal-red/40 bg-signal-red/10 text-signal-red',
  high: 'border-orange-300/30 bg-orange-300/10 text-orange-200',
  medium: 'border-signal-amber/30 bg-signal-amber/10 text-signal-amber',
  low: 'border-sky-300/30 bg-sky-300/10 text-sky-200',
  info: 'border-slate-500/30 bg-slate-500/10 text-slate-300',
};

export function ReportView({ scan }: { scan: ScanResult }) {
  const [severity, setSeverity] = useState<Severity | 'all'>('all');
  const [copied, setCopied] = useState(false);
  const filtered = useMemo(
    () =>
      severity === 'all'
        ? scan.findings
        : scan.findings.filter((item) => item.severity === severity),
    [scan.findings, severity],
  );
  async function copyReport() {
    await navigator.clipboard?.writeText(scan.summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }
  return (
    <main className="mx-auto w-full max-w-7xl px-5 pb-16 lg:px-8">
      <div className="mb-7 flex flex-col justify-between gap-4 border-b border-white/10 pb-6 sm:flex-row sm:items-end">
        <div>
          <p className="eyebrow">Scan report / {scan.context.branch}</p>
          <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
            {scan.context.owner}/{scan.context.name}
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            {scan.context.manifest.framework} ·{' '}
            {scan.context.manifest.packageManager} ·{' '}
            {scan.context.manifest.detectedTargets
              .filter((target) => target !== 'auto')
              .join(', ') || 'target auto-detected'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={copyReport}
            className="focus-ring inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-2 text-xs text-slate-300 hover:border-white/30"
          >
            {copied ? (
              <Check className="h-3.5 w-3.5" />
            ) : (
              <Clipboard className="h-3.5 w-3.5" />
            )}{' '}
            {copied ? 'Copied' : 'Copy summary'}
          </button>
          <a
            className="focus-ring inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-2 text-xs text-slate-300 hover:border-white/30"
            href={`/api/scans/${scan.id}/export?format=md`}
          >
            <Download className="h-3.5 w-3.5" /> Markdown
          </a>
          <a
            className="focus-ring inline-flex items-center gap-2 rounded-full bg-signal-green px-3 py-2 text-xs font-bold text-graphite-950 hover:brightness-105"
            href={`/api/scans/${scan.id}/export?format=html`}
            target="_blank"
          >
            Printable HTML ↗
          </a>
        </div>
      </div>
      <div className="grid gap-4 lg:grid-cols-[1.1fr_1.9fr]">
        <section className="panel grid grid-cols-[auto_1fr] items-center gap-6 rounded-3xl p-6 sm:p-8">
          <div
            className="relative grid h-36 w-36 place-items-center rounded-full border-[12px] border-white/10 sm:h-44 sm:w-44"
            style={{
              background: `conic-gradient(${scan.score < 50 ? '#ff6b6b' : scan.score < 75 ? '#ffc857' : '#b7ff5a'} ${scan.score * 3.6}deg, rgba(255,255,255,.04) 0)`,
            }}
          >
            <div className="grid h-28 w-28 place-items-center rounded-full bg-graphite-900 sm:h-36 sm:w-36">
              <span className="font-display text-4xl font-bold text-white">
                {scan.score}
              </span>
              <span className="font-mono text-[10px] uppercase tracking-widest text-slate-500">
                / 100
              </span>
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span
                className={`rounded-full border px-2.5 py-1 font-mono text-[11px] font-bold uppercase tracking-wider ${scan.readinessStatus === 'Blocked' ? severityStyles.critical : scan.readinessStatus === 'Ready' ? 'border-signal-green/30 bg-signal-green/10 text-signal-green' : severityStyles.medium}`}
              >
                {scan.readinessStatus}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-signal-blue/30 bg-signal-blue/10 px-2.5 py-1 font-mono text-[11px] text-signal-blue">
                <Sparkles className="h-3 w-3" />{' '}
                {scan.aiMode === 'seeded' ? 'Seeded AI demo' : 'Deterministic'}
              </span>
            </div>
            <h2 className="mt-4 font-display text-xl font-semibold text-white">
              Deployment readiness indicator
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-400">
              {scan.summary}
            </p>
            <p className="mt-4 font-mono text-[11px] text-slate-600">
              Score deducts 20 critical · 10 high · 5 medium · 2 low (capped by
              severity).
            </p>
          </div>
        </section>
        <section className="panel rounded-3xl p-6 sm:p-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="eyebrow">Release signal</p>
              <h2 className="mt-2 font-display text-xl font-semibold text-white">
                {scan.releaseBlockers.length} blockers need a decision
              </h2>
            </div>
            <ShieldCheck
              className="h-7 w-7 text-signal-green"
              aria-hidden="true"
            />
          </div>
          <p className="mt-4 text-sm leading-6 text-slate-400">
            {scan.deploymentSummary}
          </p>
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {(['critical', 'high', 'medium', 'low'] as const).map((level) => (
              <button
                key={level}
                onClick={() => setSeverity(severity === level ? 'all' : level)}
                className={`focus-ring rounded-2xl border p-3 text-left transition ${severity === level ? severityStyles[level] : 'border-white/10 bg-black/10 hover:border-white/25'}`}
              >
                <span className="font-mono text-[10px] uppercase tracking-widest text-slate-500">
                  {level}
                </span>
                <strong className="mt-1 block font-display text-2xl text-white">
                  {
                    scan.findings.filter((item) => item.severity === level)
                      .length
                  }
                </strong>
              </button>
            ))}
          </div>
        </section>
      </div>
      <div className="mt-8 grid gap-8 lg:grid-cols-[1.8fr_1fr]">
        <section>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="eyebrow">Evidence queue</p>
              <h2 className="mt-1 font-display text-2xl font-semibold text-white">
                Findings{' '}
                <span className="text-slate-500">({filtered.length})</span>
              </h2>
            </div>
            <div className="inline-flex items-center gap-2 text-xs text-slate-500">
              <Filter className="h-3.5 w-3.5" />{' '}
              {severity === 'all' ? 'All severities' : severity}
            </div>
          </div>
          <div className="space-y-3">
            {filtered.map((item) => {
              const originalIndex = scan.findings.indexOf(item);
              return (
                <Link
                  key={`${item.externalId}-${originalIndex}`}
                  href={`/scan/${scan.id}/finding/${originalIndex}`}
                  className="focus-ring panel group block rounded-2xl p-5 transition hover:-translate-y-0.5 hover:border-signal-green/40"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full border px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-wider ${severityStyles[item.severity]}`}
                    >
                      {item.severity}
                    </span>
                    <span className="rounded-full border border-white/10 px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-slate-500">
                      {item.category}
                    </span>
                    <span className="ml-auto font-mono text-[10px] text-slate-600">
                      confidence {Math.round(item.confidence * 100)}%
                    </span>
                  </div>
                  <h3 className="mt-3 font-display text-lg font-semibold text-white group-hover:text-signal-green">
                    {item.title}
                  </h3>
                  <p className="mt-1 text-sm leading-6 text-slate-400">
                    {item.explanation}
                  </p>
                  <div className="mt-4 flex items-center gap-2 font-mono text-xs text-slate-600">
                    <FileCode2 className="h-3.5 w-3.5" />{' '}
                    {item.filePath ?? 'repository-wide'}{' '}
                    {item.lineStart ? `· line ${item.lineStart}` : ''}
                    <ChevronRight className="ml-auto h-4 w-4 transition group-hover:translate-x-1 group-hover:text-signal-green" />
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
        <aside className="space-y-4">
          <section className="panel rounded-3xl p-6">
            <p className="eyebrow">Ship checklist</p>
            <h2 className="mt-2 font-display text-xl font-semibold text-white">
              Before production
            </h2>
            <ul className="mt-5 space-y-3">
              {scan.deploymentChecklist.map((item) => (
                <li
                  key={item}
                  className="flex gap-3 text-sm leading-5 text-slate-300"
                >
                  <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border border-signal-green/30 bg-signal-green/10 text-signal-green">
                    <Check className="h-3 w-3" />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </section>
          <section className="rounded-3xl border border-signal-blue/20 bg-signal-blue/5 p-6">
            <div className="flex items-center gap-2 text-signal-blue">
              <Sparkles className="h-4 w-4" />
              <span className="font-mono text-xs uppercase tracking-widest">
                AI boundary
              </span>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              {scan.aiMode === 'seeded'
                ? 'This report includes a clearly labeled seeded GPT-5.6 insight so the demo works offline. Live analysis activates when OPENAI_API_KEY is configured.'
                : 'AI explanations are generated from redacted repository excerpts and never receive raw secrets.'}
            </p>
          </section>
        </aside>
      </div>
    </main>
  );
}
