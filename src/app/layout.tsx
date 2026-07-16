import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';

export const metadata: Metadata = {
  title: 'LaunchGuard — Deployment readiness, before launch day',
  description: 'Turn fragile repositories into deployment-ready releases.',
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <header className="mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-6 lg:px-8">
          <Link className="focus-ring flex items-center gap-3" href="/">
            <span className="grid h-9 w-9 place-items-center rounded-xl border border-signal-green/40 bg-signal-green/10 font-mono text-signal-green">
              LG
            </span>
            <span className="font-display text-lg font-bold tracking-tight">
              LaunchGuard
            </span>
          </Link>
          <nav className="hidden items-center gap-7 text-sm text-slate-400 sm:flex">
            <Link
              className="focus-ring transition hover:text-white"
              href="/docs"
            >
              Docs
            </Link>
            <Link
              className="focus-ring transition hover:text-white"
              href="/about"
            >
              About
            </Link>
            <Link
              className="focus-ring transition hover:text-white"
              href="/privacy"
            >
              Privacy
            </Link>
          </nav>
          <Link
            className="focus-ring rounded-full border border-signal-green/40 px-4 py-2 font-mono text-xs text-signal-green transition hover:bg-signal-green hover:text-graphite-950"
            href="/demo"
          >
            Run demo ↗
          </Link>
        </header>
        {children}
        <footer className="mx-auto mt-20 flex w-full max-w-7xl flex-col gap-4 border-t border-white/10 px-5 py-8 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between lg:px-8">
          <p>© 2026 LaunchGuard · static analysis for launch day confidence</p>
          <div className="flex gap-5">
            <Link className="focus-ring hover:text-white" href="/privacy">
              Privacy boundary
            </Link>
            <Link className="focus-ring hover:text-white" href="/docs">
              Documentation
            </Link>
          </div>
        </footer>
      </body>
    </html>
  );
}
