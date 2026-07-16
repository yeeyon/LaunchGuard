import Link from 'next/link';
import {
  ArrowDownRight,
  CheckCircle2,
  CircleDashed,
  FileCode2,
  Gauge,
  LockKeyhole,
  Sparkles,
} from 'lucide-react';
import { RepositoryForm } from '@/components/repository-form';

const benefits = [
  {
    icon: Gauge,
    title: 'One score, grounded in evidence',
    text: 'Every deduction points back to a file, line, or repository-level signal.',
  },
  {
    icon: LockKeyhole,
    title: 'Secrets stay out of the model',
    text: 'Redaction happens before optional GPT-5.6 analysis or diagnostic logging.',
  },
  {
    icon: FileCode2,
    title: 'Fixes you can review',
    text: 'Generated patches are diff-shaped artifacts—not silent changes to your codebase.',
  },
];

export default function HomePage() {
  return (
    <main className="overflow-hidden">
      <section className="relative mx-auto max-w-7xl px-5 pb-20 pt-10 lg:px-8 lg:pb-28 lg:pt-16">
        <div className="pointer-events-none absolute -right-40 top-0 h-[34rem] w-[34rem] rounded-full bg-signal-green/5 blur-3xl" />
        <div className="grid gap-14 lg:grid-cols-[1.1fr_.9fr] lg:items-center">
          <div className="rise">
            <p className="eyebrow flex items-center gap-2">
              <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-signal-green" />{' '}
              release control for serious builders
            </p>
            <h1 className="mt-5 max-w-3xl font-display text-5xl font-bold leading-[.98] tracking-[-.05em] text-white sm:text-7xl">
              Know whether your repository is{' '}
              <span className="text-signal-green">ready to launch.</span>
            </h1>
            <p className="mt-7 max-w-2xl text-lg leading-8 text-slate-400">
              LaunchGuard identifies deployment blockers, explains their impact,
              and generates reviewable fixes before production finds the
              problems for you.
            </p>
            <div className="mt-9 max-w-3xl">
              <RepositoryForm />
            </div>
            <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-500">
              <span className="inline-flex items-center gap-2">
                <CircleDashed className="h-3.5 w-3.5 text-signal-green" />{' '}
                deterministic checks first
              </span>
              <span className="inline-flex items-center gap-2">
                <Sparkles className="h-3.5 w-3.5 text-signal-blue" /> GPT-5.6
                when configured
              </span>
              <Link
                className="focus-ring inline-flex items-center gap-1 text-slate-300 hover:text-white"
                href="/privacy"
              >
                read the boundary <ArrowDownRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
          <div className="rise-2 relative">
            <div className="grid-texture panel relative overflow-hidden rounded-[2rem] p-4 sm:p-6">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[.2em] text-slate-600">
                    latest readiness report
                  </p>
                  <p className="mt-1 font-mono text-xs text-slate-400">
                    acme / storefront · main
                  </p>
                </div>
                <span className="rounded-full border border-signal-amber/30 bg-signal-amber/10 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-signal-amber">
                  needs attention
                </span>
              </div>
              <div className="grid grid-cols-[auto_1fr] items-center gap-5 border-b border-white/10 py-7">
                <div className="grid h-28 w-28 place-items-center rounded-full border-[10px] border-signal-amber/80">
                  <div className="grid h-20 w-20 place-items-center rounded-full bg-graphite-900">
                    <strong className="font-display text-3xl text-white">
                      71
                    </strong>
                    <span className="font-mono text-[9px] text-slate-500">
                      / 100
                    </span>
                  </div>
                </div>
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-widest text-slate-500">
                    release signal
                  </p>
                  <p className="mt-2 font-display text-lg font-semibold text-white">
                    2 blockers before launch
                  </p>
                  <div className="mt-3 flex gap-2">
                    <span className="h-1.5 w-16 rounded-full bg-signal-red" />
                    <span className="h-1.5 w-9 rounded-full bg-signal-amber" />
                    <span className="h-1.5 w-6 rounded-full bg-signal-green" />
                  </div>
                </div>
              </div>
              <div className="space-y-3 py-5">
                <div className="rounded-xl border border-signal-red/20 bg-signal-red/5 p-3">
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-signal-red/15 px-1.5 py-0.5 font-mono text-[9px] uppercase text-signal-red">
                      critical
                    </span>
                    <span className="font-mono text-[10px] text-slate-600">
                      src/config.ts:12
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-slate-200">
                    Server secret is exposed through NEXT_PUBLIC_
                  </p>
                </div>
                <div className="rounded-xl border border-signal-amber/20 bg-signal-amber/5 p-3">
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-signal-amber/15 px-1.5 py-0.5 font-mono text-[9px] uppercase text-signal-amber">
                      high
                    </span>
                    <span className="font-mono text-[10px] text-slate-600">
                      Dockerfile:1
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-slate-200">
                    Production image runs as root
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between border-t border-white/10 pt-4 font-mono text-[10px] text-slate-600">
                <span>deterministic + AI-assisted</span>
                <span className="text-signal-green">view report ↗</span>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="mx-auto grid max-w-7xl gap-4 px-5 pb-20 sm:grid-cols-3 lg:px-8">
        {benefits.map(({ icon: Icon, title, text }, index) => (
          <div
            className={`rise-${index + 1} rounded-3xl border border-white/10 bg-white/[.025] p-6`}
            key={title}
          >
            <Icon className="h-5 w-5 text-signal-green" aria-hidden="true" />
            <h2 className="mt-5 font-display text-lg font-semibold text-white">
              {title}
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">{text}</p>
          </div>
        ))}
      </section>
      <section className="mx-auto max-w-7xl px-5 pb-8 lg:px-8">
        <div className="grid gap-6 rounded-[2rem] border border-signal-blue/15 bg-signal-blue/[.04] p-7 sm:p-10 lg:grid-cols-[.75fr_1.25fr] lg:items-center">
          <div>
            <p className="eyebrow text-signal-blue">how it works</p>
            <h2 className="mt-3 max-w-md font-display text-3xl font-bold tracking-tight text-white">
              A deterministic spine, with GPT-5.6 on top.
            </h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-black/10 p-4">
              <span className="font-mono text-xs text-signal-green">
                01 / inspect
              </span>
              <p className="mt-3 text-sm leading-6 text-slate-300">
                Bounded files, package signals, deployment hints, and redacted
                excerpts.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/10 p-4">
              <span className="font-mono text-xs text-signal-amber">
                02 / explain
              </span>
              <p className="mt-3 text-sm leading-6 text-slate-300">
                Optional GPT-5.6 context analysis connects contradictions across
                files.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/10 p-4">
              <span className="font-mono text-xs text-signal-blue">
                03 / review
              </span>
              <p className="mt-3 text-sm leading-6 text-slate-300">
                Evidence, checklist, and unified diffs keep humans in control.
              </p>
            </div>
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-5 pb-6 pt-8 text-center lg:px-8">
        <CheckCircle2 className="mx-auto h-5 w-5 text-signal-green" />
        <p className="mt-3 font-mono text-xs uppercase tracking-[.18em] text-slate-600">
          built for the moment before “ship it”
        </p>
      </section>
    </main>
  );
}
