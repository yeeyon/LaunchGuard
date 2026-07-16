import { looksBinary } from '@/lib/security/redact';
import type { RepositoryFile } from '@/types/domain';

const SKIP_SEGMENTS = new Set([
  '.git',
  'node_modules',
  '.next',
  'dist',
  'build',
  'coverage',
  'vendor',
  '.turbo',
]);
const HIGH_SIGNAL = [
  /^package(-lock)?\.json$/,
  /^next\.config\./,
  /^tsconfig\.json$/,
  /^Dockerfile/,
  /^docker-compose\./,
  /^vercel\.json$/,
  /^\.env/,
  /^README/i,
  /^prisma\//,
  /^\.github\/workflows\//,
  /^src\/(app|pages|lib|server)\//,
  /^(server|middleware)\./,
  /^terraform\//,
  /^(serverless\.yml|template\.yaml)$/,
];

export interface FilterOptions {
  maxFiles: number;
  maxFileBytes: number;
  maxTotalBytes: number;
}

export function shouldSkipPath(path: string): boolean {
  return (
    path.split('/').some((segment) => SKIP_SEGMENTS.has(segment)) ||
    /\.(png|jpe?g|gif|webp|ico|pdf|zip|woff2?|mp4|mov|lockb)$/i.test(path)
  );
}

export function isHighSignal(path: string): boolean {
  return HIGH_SIGNAL.some((pattern) => pattern.test(path));
}

export function filterRepositoryFiles(
  files: RepositoryFile[],
  options: FilterOptions,
): RepositoryFile[] {
  const candidates = files.filter(
    (file) =>
      !shouldSkipPath(file.path) &&
      file.size <= options.maxFileBytes &&
      !looksBinary(file.content),
  );
  candidates.sort(
    (a, b) =>
      Number(isHighSignal(b.path)) - Number(isHighSignal(a.path)) ||
      a.path.localeCompare(b.path),
  );
  const selected: RepositoryFile[] = [];
  let total = 0;
  for (const file of candidates) {
    if (
      selected.length >= options.maxFiles ||
      total + file.size > options.maxTotalBytes
    )
      continue;
    selected.push(file);
    total += file.size;
  }
  return selected;
}
