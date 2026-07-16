import { RepositoryForm } from '@/components/repository-form';

export default function IntakePage() {
  return (
    <main className="mx-auto w-full max-w-5xl px-5 pb-20 pt-10 lg:px-8 lg:pt-20">
      <p className="eyebrow">repository intake</p>
      <h1 className="mt-4 max-w-3xl font-display text-5xl font-bold tracking-tight text-white">
        Start with a public repository.
      </h1>
      <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-400">
        LaunchGuard reads bounded, high-signal files from GitHub. No code is
        executed, and the demo works without an account.
      </p>
      <div className="mt-9 max-w-3xl">
        <RepositoryForm />
      </div>
      <div className="mt-12 grid gap-4 sm:grid-cols-3">
        <div className="panel rounded-2xl p-5">
          <p className="font-mono text-xs text-signal-green">01 / URL</p>
          <p className="mt-3 text-sm leading-6 text-slate-400">
            Use https://github.com/owner/repository. Private repos need a future
            authenticated connector.
          </p>
        </div>
        <div className="panel rounded-2xl p-5">
          <p className="font-mono text-xs text-signal-amber">02 / scope</p>
          <p className="mt-3 text-sm leading-6 text-slate-400">
            The scanner skips binaries, generated output, and oversized files
            before analysis.
          </p>
        </div>
        <div className="panel rounded-2xl p-5">
          <p className="font-mono text-xs text-signal-blue">03 / report</p>
          <p className="mt-3 text-sm leading-6 text-slate-400">
            Get evidence, score deductions, checklist items, and reviewable
            patch candidates.
          </p>
        </div>
      </div>
    </main>
  );
}
