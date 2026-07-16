import Link from 'next/link';
import {
  ArrowLeft,
  Check,
  Clipboard,
  Download,
  FileCode2,
  ShieldAlert,
} from 'lucide-react';
import { notFound } from 'next/navigation';
import { getScanAsync } from '@/server/store';
import { FindingActions } from '@/components/finding-actions';

export const dynamic = 'force-dynamic';

export default async function FindingPage({
  params,
}: {
  params: { id: string; findingId: string };
}) {
  const scan = await getScanAsync(params.id);
  const item = scan?.findings[Number(params.findingId)];
  if (!scan || !item) notFound();
  return (
    <main className="mx-auto w-full max-w-5xl px-5 pb-16 lg:px-8">
      <Link
        href={`/scan/${scan.id}`}
        className="focus-ring inline-flex items-center gap-2 font-mono text-xs text-slate-500 hover:text-white"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to report
      </Link>
      <div className="mt-7 flex flex-wrap items-center gap-2">
        <span className="rounded-full border border-signal-red/40 bg-signal-red/10 px-2.5 py-1 font-mono text-[11px] font-bold uppercase tracking-wider text-signal-red">
          {item.severity}
        </span>
        <span className="rounded-full border border-white/10 px-2.5 py-1 font-mono text-[11px] uppercase tracking-wider text-slate-500">
          {item.category}
        </span>
        <span className="ml-auto font-mono text-xs text-slate-600">
          confidence {Math.round(item.confidence * 100)}%
        </span>
      </div>
      <h1 className="mt-5 max-w-4xl font-display text-4xl font-bold tracking-tight text-white sm:text-5xl">
        {item.title}
      </h1>
      <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-400">
        {item.explanation}
      </p>
      <FindingActions
        scanId={scan.id}
        findingId={params.findingId}
        instructions={[...item.remediation, ...item.verificationSteps].join(
          '\n',
        )}
        patch={item.patchCandidate?.unifiedDiff}
      />
      <div className="mt-9 grid gap-5 lg:grid-cols-[1.1fr_.9fr]">
        <section className="space-y-5">
          <div className="panel rounded-3xl p-6">
            <div className="flex items-center gap-2 text-signal-amber">
              <ShieldAlert className="h-4 w-4" />
              <span className="eyebrow text-signal-amber">
                production impact
              </span>
            </div>
            <p className="mt-3 leading-7 text-slate-300">
              {item.deploymentImpact}
            </p>
          </div>
          <div className="panel rounded-3xl p-6">
            <div className="flex items-center gap-2">
              <FileCode2 className="h-4 w-4 text-signal-green" />
              <span className="eyebrow">evidence</span>
            </div>
            <div className="mt-4 rounded-2xl border border-white/10 bg-black/25 p-4">
              <p className="font-mono text-xs text-slate-500">
                {item.filePath ?? 'repository-wide'}
                {item.lineStart ? `:${item.lineStart}` : ''}
              </p>
              <p className="mt-3 whitespace-pre-wrap font-mono text-sm leading-6 text-slate-200">
                {item.evidence}
              </p>
            </div>
          </div>
          {item.patchCandidate && (
            <div className="panel rounded-3xl p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="eyebrow text-signal-blue">reviewable patch</p>
                  <h2 className="mt-2 font-display text-xl font-semibold text-white">
                    {item.patchCandidate.summary}
                  </h2>
                </div>
                <div className="flex gap-2">
                  <button
                    className="focus-ring rounded-full border border-white/10 p-2 text-slate-400 hover:text-white"
                    aria-label="Copy patch"
                  >
                    <Clipboard className="h-4 w-4" />
                  </button>
                  <a
                    className="focus-ring rounded-full border border-white/10 p-2 text-slate-400 hover:text-white"
                    href={`data:text/plain;charset=utf-8,${encodeURIComponent(item.patchCandidate.unifiedDiff)}`}
                    download="launchguard-fix.patch"
                    aria-label="Download patch"
                  >
                    <Download className="h-4 w-4" />
                  </a>
                </div>
              </div>
              <pre className="mt-5 overflow-x-auto rounded-2xl border border-white/10 bg-[#070909] p-4 font-mono text-xs leading-6 text-slate-300">
                <code>{item.patchCandidate.unifiedDiff}</code>
              </pre>
              <p className="mt-4 text-xs leading-5 text-slate-500">
                AI-generated patch candidate. Review and verify locally;
                LaunchGuard does not apply or compile it automatically.
              </p>
            </div>
          )}
        </section>
        <aside className="space-y-5">
          <div className="panel rounded-3xl p-6">
            <p className="eyebrow">recommended remediation</p>
            <ol className="mt-5 space-y-4">
              {item.remediation.map((step, index) => (
                <li
                  className="flex gap-3 text-sm leading-6 text-slate-300"
                  key={step}
                >
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full border border-signal-green/30 font-mono text-xs text-signal-green">
                    {index + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
          </div>
          <div className="panel rounded-3xl p-6">
            <p className="eyebrow">verification steps</p>
            <ul className="mt-5 space-y-3">
              {item.verificationSteps.map((step) => (
                <li
                  className="flex gap-3 text-sm leading-6 text-slate-300"
                  key={step}
                >
                  <Check className="mt-1 h-4 w-4 shrink-0 text-signal-green" />
                  {step}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-3xl border border-signal-green/20 bg-signal-green/[.04] p-6">
            <p className="font-mono text-xs uppercase tracking-widest text-signal-green">
              human review gate
            </p>
            <p className="mt-3 text-sm leading-6 text-slate-400">
              Marking a finding reviewed or resolved is a report annotation
              only. No remote repository changes happen here.
            </p>
          </div>
        </aside>
      </div>
    </main>
  );
}
