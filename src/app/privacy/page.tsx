export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-4xl px-5 pb-20 pt-10 lg:px-8 lg:pt-20">
      <p className="eyebrow">privacy boundary</p>
      <h1 className="mt-4 font-display text-5xl font-bold tracking-tight text-white">
        Analyze only what you are authorized to inspect.
      </h1>
      <div className="mt-8 space-y-8 text-sm leading-7 text-slate-400">
        <section>
          <h2 className="font-display text-2xl font-semibold text-white">
            What we examine
          </h2>
          <p className="mt-3">
            LaunchGuard reads public GitHub metadata and a bounded selection of
            high-signal text files: package manifests, framework configuration,
            deployment files, workflows, documentation, and selected source. It
            skips binaries, generated output, vendor directories, and oversized
            content.
          </p>
        </section>
        <section>
          <h2 className="font-display text-2xl font-semibold text-white">
            What may reach OpenAI
          </h2>
          <p className="mt-3">
            Only redacted excerpts and the derived manifest may be sent for
            optional architecture analysis. API keys, passwords, bearer tokens,
            private keys, connection strings, and .env values are replaced with
            [REDACTED]. Repository text is treated as untrusted data;
            instructions inside files are never followed.
          </p>
        </section>
        <section>
          <h2 className="font-display text-2xl font-semibold text-white">
            What is stored
          </h2>
          <p className="mt-3">
            Reports store repository metadata, redacted excerpts, findings,
            summaries, checklist state, and patch candidates. The MVP does not
            permanently store a complete repository checkout. Configure
            PostgreSQL retention according to your deployment policy.
          </p>
        </section>
        <section>
          <h2 className="font-display text-2xl font-semibold text-white">
            Your responsibility
          </h2>
          <p className="mt-3">
            Do not scan repositories, source code, or configuration you are not
            authorized to inspect. LaunchGuard is a defensive
            deployment-readiness tool, not a penetration-testing service or a
            vulnerability database.
          </p>
        </section>
      </div>
    </main>
  );
}
