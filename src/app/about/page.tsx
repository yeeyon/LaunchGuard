import Link from 'next/link';

export default function AboutPage() {
  return (
    <main className="mx-auto max-w-4xl px-5 pb-20 pt-10 lg:px-8 lg:pt-20">
      <p className="eyebrow">about launchguard</p>
      <h1 className="mt-4 font-display text-5xl font-bold tracking-tight text-white">
        The last review before “ship it.”
      </h1>
      <div className="mt-8 space-y-6 text-lg leading-8 text-slate-400">
        <p>
          LaunchGuard is for small product teams and independent builders who
          can make an application work locally, but do not want deployment day
          to be the first time production configuration is exercised.
        </p>
        <p>
          It combines bounded deterministic checks with optional GPT-5.6
          architecture reasoning. The model adds connective tissue—why a
          configuration contradiction matters, what to fix first, and how to
          verify it—while the score and safety boundaries remain deterministic.
        </p>
      </div>
      <div className="mt-12 grid gap-4 sm:grid-cols-2">
        <div className="panel rounded-3xl p-6">
          <p className="eyebrow">audience</p>
          <h2 className="mt-3 font-display text-2xl font-semibold text-white">
            Builders without a platform team
          </h2>
          <p className="mt-3 text-sm leading-6 text-slate-400">
            One report that turns scattered launch anxiety into a prioritized
            release plan.
          </p>
        </div>
        <div className="panel rounded-3xl p-6">
          <p className="eyebrow">principle</p>
          <h2 className="mt-3 font-display text-2xl font-semibold text-white">
            Humans approve every change
          </h2>
          <p className="mt-3 text-sm leading-6 text-slate-400">
            Patches are reviewable diffs. LaunchGuard never opens a pull request
            or modifies a remote repository.
          </p>
        </div>
      </div>
      <Link
        href="/demo"
        className="focus-ring mt-10 inline-flex rounded-full bg-signal-green px-5 py-3 font-bold text-graphite-950"
      >
        See the broken-repo demo ↗
      </Link>
    </main>
  );
}
