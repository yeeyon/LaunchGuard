import {
  extractEnvironmentVariables,
  redactSecrets,
} from '@/lib/security/redact';
import type {
  DeploymentTarget,
  RepositoryContext,
  RepositoryFile,
  RepositoryManifest,
} from '@/types/domain';

function parseJsonFile<T>(
  files: RepositoryFile[],
  path: string,
): T | undefined {
  const file = files.find((item) => item.path === path);
  if (!file) return undefined;
  try {
    return JSON.parse(file.content) as T;
  } catch {
    return undefined;
  }
}

export function buildManifest(
  input: Omit<RepositoryContext, 'manifest'>,
): RepositoryManifest {
  const packageJson = parseJsonFile<{
    scripts?: Record<string, string>;
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
    engines?: Record<string, string>;
  }>(input.files, 'package.json');
  const hasDocker = input.files.some((file) => /^Dockerfile/.test(file.path));
  const hasVercel = input.files.some((file) => file.path === 'vercel.json');
  const targets: DeploymentTarget[] = ['auto'];
  if (hasDocker) targets.push('docker');
  if (hasVercel) targets.push('vercel');
  if (
    input.files.some((file) =>
      /terraform|serverless|template\.yaml|aws/i.test(file.path),
    )
  )
    targets.push('aws');
  const framework =
    packageJson?.dependencies?.next || packageJson?.devDependencies?.next
      ? 'Next.js'
      : packageJson?.dependencies?.react
        ? 'React'
        : 'Node.js';
  const packageManager = input.files.some(
    (file) => file.path === 'pnpm-lock.yaml',
  )
    ? 'pnpm'
    : input.files.some((file) => file.path === 'yarn.lock')
      ? 'yarn'
      : 'npm';
  const runtime = packageJson?.engines?.node ?? 'Node.js 20 (recommended)';
  const excerpts = input.files.slice(0, 24).map((file) => ({
    path: file.path,
    content: redactSecrets(file.content, file.path).slice(0, 12000),
  }));
  return {
    owner: input.owner,
    name: input.name,
    branch: input.branch,
    framework,
    packageManager,
    runtime,
    importantFiles: input.files.map((file) => file.path),
    detectedTargets: targets,
    environmentVariables: extractEnvironmentVariables(input.files),
    scripts: packageJson?.scripts ?? {},
    dependencies: {
      ...(packageJson?.dependencies ?? {}),
      ...(packageJson?.devDependencies ?? {}),
    },
    excerpts,
  };
}
