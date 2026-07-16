import Link from 'next/link';

export default function DocsPage() {
  return (
    <main className="mx-auto max-w-5xl px-5 pb-20 pt-10 lg:px-8 lg:pt-20">
      <p className="eyebrow">quickstart</p>
      <h1 className="mt-4 font-display text-5xl font-bold tracking-tight text-white">
        From clone to first report.
      </h1>
      <div className="mt-10 grid gap-5 lg:grid-cols-3">
        <section className="panel rounded-3xl p-6 lg:col-span-2">
          <h2 className="font-display text-2xl font-semibold text-white">
            Run the demo
          </h2>
          <pre className="mt-5 overflow-x-auto rounded-2xl bg-black/30 p-5 font-mono text-sm leading-7 text-slate-300">
            <code>npm ci{`\n`}npm run dev</code>
          </pre>
          <p className="mt-5 text-sm leading-6 text-slate-400">
            Open{' '}
            <code className="rounded bg-white/10 px-1.5 py-0.5 text-signal-green">
              http://localhost:3000
            </code>{' '}
            and choose “Run the broken-repo demo”. It runs deterministic checks
            against the bundled fixture and labels its seeded AI insight.
          </p>
        </section>
        <section className="rounded-3xl border border-signal-blue/20 bg-signal-blue/[.04] p-6">
          <p className="eyebrow text-signal-blue">optional live mode</p>
          <p className="mt-4 text-sm leading-6 text-slate-300">
            Set OPENAI_API_KEY and OPENAI_MODEL in .env. The server keeps the
            key private and sends only redacted context.
          </p>
          <Link
            href="/privacy"
            className="focus-ring mt-6 inline-flex text-sm font-semibold text-signal-blue hover:text-white"
          >
            Read the privacy boundary ↗
          </Link>
        </section>
      </div>
      <section className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="panel rounded-2xl p-5">
          <p className="font-mono text-xs text-signal-green">deterministic</p>
          <p className="mt-3 text-sm leading-6 text-slate-400">
            Package, environment, Docker, Next.js, TypeScript, CI, Prisma, docs,
            Vercel, and AWS heuristics.
          </p>
        </div>
        <div className="panel rounded-2xl p-5">
          <p className="font-mono text-xs text-signal-amber">bounded</p>
          <p className="mt-3 text-sm leading-6 text-slate-400">
            No arbitrary URL fetches. No repository execution. Strict per-file
            and total context limits.
          </p>
        </div>
        <div className="panel rounded-2xl p-5">
          <p className="font-mono text-xs text-signal-blue">reviewable</p>
          <p className="mt-3 text-sm leading-6 text-slate-400">
            Markdown, JSON, printable HTML, and patch artifacts keep the
            operator in control.
          </p>
        </div>
      </section>
    </main>
  );
}
