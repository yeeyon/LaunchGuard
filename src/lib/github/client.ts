import { normalizeGithubUrl } from '@/lib/validation/url';
import { buildManifest } from '@/server/ingestion/manifest';
import { isHighSignal, shouldSkipPath } from '@/server/ingestion/filter';
import type {
  DeploymentTarget,
  RepositoryContext,
  RepositoryFile,
} from '@/types/domain';

type RepoResponse = {
  name: string;
  owner: { login: string };
  default_branch: string;
  private: boolean;
  size: number;
};
type TreeResponse = {
  truncated: boolean;
  tree: Array<{
    path: string;
    type: 'blob' | 'tree';
    sha: string;
    size?: number;
  }>;
};
type BlobResponse = { encoding: string; content: string; size: number };

export class GithubIngestionError extends Error {
  constructor(
    public code: string,
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}

function limits() {
  return {
    maxFiles: Number(process.env.REPOSITORY_MAX_FILES || 250),
    maxFileBytes: Number(process.env.REPOSITORY_MAX_FILE_BYTES || 100_000),
    maxTotalBytes: Number(process.env.REPOSITORY_MAX_TOTAL_BYTES || 1_500_000),
  };
}

async function githubFetch<T>(url: string): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12_000);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        ...(process.env.GITHUB_TOKEN
          ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` }
          : {}),
      },
      cache: 'no-store',
    });
    if (response.status === 404)
      throw new GithubIngestionError(
        'REPOSITORY_NOT_FOUND',
        'The repository or branch could not be found.',
        404,
      );
    if (
      response.status === 403 &&
      response.headers.get('x-ratelimit-remaining') === '0'
    )
      throw new GithubIngestionError(
        'GITHUB_RATE_LIMITED',
        'GitHub rate limited this scan. Add GITHUB_TOKEN or try again later.',
        429,
      );
    if (!response.ok)
      throw new GithubIngestionError(
        'GITHUB_REQUEST_FAILED',
        'GitHub could not provide the repository contents.',
        502,
      );
    return (await response.json()) as T;
  } catch (error) {
    if (error instanceof GithubIngestionError) throw error;
    throw new GithubIngestionError(
      'GITHUB_REQUEST_FAILED',
      'GitHub did not respond in time.',
      504,
    );
  } finally {
    clearTimeout(timeout);
  }
}

export async function collectGithubRepository(
  repositoryUrl: string,
  branch?: string,
  requestedTarget: DeploymentTarget = 'auto',
): Promise<RepositoryContext> {
  let normalized;
  try {
    normalized = normalizeGithubUrl(repositoryUrl);
  } catch {
    throw new GithubIngestionError(
      'INVALID_REPOSITORY_URL',
      'Enter a public GitHub repository URL.',
      400,
    );
  }
  const max = limits();
  const repository = await githubFetch<RepoResponse>(
    `https://api.github.com/repos/${normalized.owner}/${normalized.name}`,
  );
  if (repository.private)
    throw new GithubIngestionError(
      'REPOSITORY_PRIVATE',
      'Private repositories are not supported without authenticated access.',
      403,
    );
  if (repository.size * 1024 > max.maxTotalBytes * 80)
    throw new GithubIngestionError(
      'REPOSITORY_TOO_LARGE',
      'This repository is too large for the bounded MVP scanner.',
      413,
    );
  const selectedBranch = branch?.trim() || repository.default_branch;
  const tree = await githubFetch<TreeResponse>(
    `https://api.github.com/repos/${normalized.owner}/${normalized.name}/git/trees/${encodeURIComponent(selectedBranch)}?recursive=1`,
  );
  if (tree.truncated)
    throw new GithubIngestionError(
      'REPOSITORY_TOO_LARGE',
      'GitHub returned an incomplete repository tree. Try a smaller repository.',
      413,
    );
  const blobs = tree.tree
    .filter(
      (item) =>
        item.type === 'blob' &&
        !shouldSkipPath(item.path) &&
        (item.size ?? 0) <= max.maxFileBytes,
    )
    .sort(
      (a, b) =>
        Number(isHighSignal(b.path)) - Number(isHighSignal(a.path)) ||
        a.path.localeCompare(b.path),
    )
    .slice(0, max.maxFiles);
  const files: RepositoryFile[] = [];
  let total = 0;
  for (let index = 0; index < blobs.length; index += 8) {
    const batch = await Promise.all(
      blobs.slice(index, index + 8).map(async (entry) => ({
        entry,
        blob: await githubFetch<BlobResponse>(
          `https://api.github.com/repos/${normalized.owner}/${normalized.name}/git/blobs/${entry.sha}`,
        ),
      })),
    );
    for (const { entry, blob } of batch) {
      if (blob.encoding !== 'base64' || total + blob.size > max.maxTotalBytes)
        continue;
      const content = Buffer.from(
        blob.content.replace(/\n/g, ''),
        'base64',
      ).toString('utf8');
      if (content.includes('\u0000')) continue;
      files.push({ path: entry.path, content, size: blob.size });
      total += blob.size;
    }
    if (total >= max.maxTotalBytes) break;
  }
  if (!files.some((item) => item.path === 'package.json'))
    throw new GithubIngestionError(
      'UNSUPPORTED_REPOSITORY',
      'The MVP currently supports Node.js and Next.js repositories with package.json.',
      422,
    );
  const base = {
    source: 'github' as const,
    url: normalized.url,
    owner: repository.owner.login,
    name: repository.name,
    branch: selectedBranch,
    files,
  };
  const manifest = buildManifest(base);
  if (
    requestedTarget !== 'auto' &&
    !manifest.detectedTargets.includes(requestedTarget)
  )
    manifest.detectedTargets.push(requestedTarget);
  return { ...base, manifest };
}
