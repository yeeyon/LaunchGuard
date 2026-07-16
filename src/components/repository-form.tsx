'use client';

import { useState } from 'react';
import { ArrowUpRight, Loader2, Play, Search } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function RepositoryForm() {
  const router = useRouter();
  const [repositoryUrl, setRepositoryUrl] = useState('');
  const [target, setTarget] = useState('auto');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState('');
  async function startScan(demo = false) {
    setError('');
    setLoading(true);
    try {
      const response = await fetch('/api/scans?stream=1', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(demo ? { demo: true } : { repositoryUrl, target }),
      });
      if (!response.ok || !response.body)
        throw new Error('Unable to start scan.');
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let pending = '';
      while (true) {
        const { value, done } = await reader.read();
        pending += decoder.decode(value, { stream: !done });
        const lines = pending.split('\n');
        pending = lines.pop() ?? '';
        for (const line of lines.filter(Boolean)) {
          const event = JSON.parse(line);
          if (event.stage) setStage(event.stage);
          if (event.error) throw new Error(event.error.message);
          if (event.done) {
            router.push(`/scan/${event.scan.id}`);
            return;
          }
        }
        if (done) break;
      }
      throw new Error('The scan ended before a report was created.');
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : 'Unable to start scan.',
      );
      setLoading(false);
    }
  }
  const labels: Record<string, string> = {
    reading: 'Reading repository',
    detecting: 'Detecting framework and target',
    deterministic: 'Running deterministic checks',
    redacting: 'Redacting sensitive information',
    ai: 'Performing GPT-5.6 analysis',
    scoring: 'Calculating deployment readiness',
    patches: 'Preparing recommended fixes',
    finalizing: 'Finalizing report',
  };
  return (
    <div className="panel rounded-3xl p-3 sm:p-4">
      <div className="flex flex-col gap-3 lg:flex-row">
        <label className="flex min-w-0 flex-1 items-center gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
          <Search
            className="h-5 w-5 shrink-0 text-slate-500"
            aria-hidden="true"
          />
          <span className="sr-only">Public GitHub repository URL</span>
          <input
            value={repositoryUrl}
            onChange={(event) => setRepositoryUrl(event.target.value)}
            className="focus-ring min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-slate-600"
            placeholder="https://github.com/owner/repository"
            inputMode="url"
          />
        </label>
        <select
          value={target}
          onChange={(event) => setTarget(event.target.value)}
          className="focus-ring rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-slate-300 outline-none"
        >
          <option value="auto">Detect target</option>
          <option value="vercel">Vercel</option>
          <option value="docker">Docker</option>
          <option value="aws">AWS</option>
          <option value="node">Node.js server</option>
        </select>
        <button
          onClick={() => startScan()}
          disabled={loading || !repositoryUrl}
          className="focus-ring inline-flex items-center justify-center gap-2 rounded-2xl bg-signal-green px-5 py-3 font-bold text-graphite-950 transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
          )}{' '}
          Audit repository
        </button>
      </div>
      {loading && (
        <div
          aria-live="polite"
          className="mt-3 flex items-center gap-2 rounded-xl border border-signal-green/15 bg-signal-green/5 px-3 py-2 font-mono text-xs text-signal-green"
        >
          <Loader2 className="h-3.5 w-3.5 animate-spin" />{' '}
          {labels[stage] ?? 'Starting scan'}
        </div>
      )}
      {error && (
        <p role="alert" className="px-2 pt-3 text-sm text-signal-red">
          {error}
        </p>
      )}
      <button
        onClick={() => startScan(true)}
        disabled={loading}
        className="focus-ring mt-3 inline-flex items-center gap-2 px-2 text-xs font-semibold text-signal-green transition hover:text-white disabled:opacity-50"
      >
        <Play className="h-3.5 w-3.5" aria-hidden="true" /> Run the broken-repo
        demo{' '}
        <span className="font-normal text-slate-600">
          — no credentials needed
        </span>
      </button>
    </div>
  );
}
