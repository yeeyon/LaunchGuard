import type { AnalyzerFinding, RepositoryContext } from '@/types/domain';
import type { RepositoryAnalyzer } from './types';
import { file, finding, lineOf } from './types';

type PackageShape = {
  scripts?: Record<string, string>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  engines?: { node?: string };
};

function packageJson(context: RepositoryContext): PackageShape | undefined {
  try {
    return JSON.parse(
      file(context, 'package.json')?.content ?? '',
    ) as PackageShape;
  } catch {
    return undefined;
  }
}

export const packageAnalyzer: RepositoryAnalyzer = {
  id: 'package',
  name: 'Package configuration',
  supports: (ctx) => Boolean(file(ctx, 'package.json')),
  async analyze(ctx) {
    const pkg = packageJson(ctx);
    if (!pkg)
      return [
        finding({
          externalId: 'package-invalid-json',
          title: 'package.json cannot be parsed',
          category: 'build',
          severity: 'critical',
          confidence: 1,
          filePath: 'package.json',
          evidence: 'The file is not valid JSON.',
          explanation:
            'Node tooling cannot reliably install or run this project while package.json is malformed.',
          deploymentImpact:
            'Dependency installation and production builds will fail.',
          remediation: ['Repair the JSON syntax.'],
          verificationSteps: ['Run npm install.', 'Run npm run build.'],
        }),
      ];
    const output: AnalyzerFinding[] = [];
    const scripts = pkg.scripts ?? {};
    if (!scripts.build)
      output.push(
        finding({
          externalId: 'package-missing-build',
          title: 'Production build script is missing',
          category: 'build',
          severity: 'critical',
          confidence: 1,
          filePath: 'package.json',
          evidence: 'scripts.build is not defined.',
          explanation:
            'Deployment platforms commonly invoke the package build script to produce a release artifact.',
          deploymentImpact:
            'Vercel, CI, and container builds cannot use a standard production entry point.',
          remediation: [
            'Add the framework production build command to scripts.build.',
          ],
          verificationSteps: ['Run npm run build from a clean checkout.'],
          patchCandidate: {
            summary: 'Add the standard Next.js production build script.',
            unifiedDiff: `--- a/package.json\n+++ b/package.json\n@@ -2,6 +2,7 @@\n   \"scripts\": {\n+    \"build\": \"next build\",\n     \"dev\": \"next dev\"\n   }`,
          },
        }),
      );
    if (!scripts.start)
      output.push(
        finding({
          externalId: 'package-missing-start',
          title: 'Production start script is missing',
          category: 'build',
          severity: 'high',
          confidence: 0.96,
          filePath: 'package.json',
          evidence: 'scripts.start is not defined.',
          explanation:
            'A generic Node or container deployment needs a stable production start command.',
          deploymentImpact:
            'The built application may not have a documented runtime entry point.',
          remediation: ['Add a production start script such as next start.'],
          verificationSteps: ['Run npm run build, then npm start.'],
        }),
      );
    for (const [name, command] of [
      ['typecheck', 'type check'],
      ['lint', 'lint'],
      ['test', 'test'],
    ] as const)
      if (!scripts[name])
        output.push(
          finding({
            externalId: `package-missing-${name}`,
            title: `${command[0].toUpperCase()}${command.slice(1)} command is missing`,
            category: 'cicd',
            severity: 'medium',
            confidence: 0.98,
            filePath: 'package.json',
            evidence: `scripts.${name} is not defined.`,
            explanation: `A repeatable ${command} command lets CI catch release regressions before deployment.`,
            deploymentImpact:
              'Validation coverage is incomplete or cannot be invoked consistently.',
            remediation: [`Add a ${name} script.`],
            verificationSteps: [`Run npm run ${name}.`],
          }),
        );
    if (
      !ctx.files.some((item) =>
        /^(package-lock\.json|pnpm-lock\.yaml|yarn\.lock)$/.test(item.path),
      )
    )
      output.push(
        finding({
          externalId: 'package-lockfile',
          title: 'Dependency lockfile is missing',
          category: 'dependencies',
          severity: 'high',
          confidence: 1,
          evidence: 'No npm, pnpm, or Yarn lockfile was found.',
          explanation:
            'Unpinned transitive dependencies make clean deployments non-reproducible.',
          deploymentImpact:
            'A deployment can install different packages than local development.',
          remediation: ['Generate and commit exactly one lockfile.'],
          verificationSteps: ['Run npm ci in a clean checkout.'],
        }),
      );
    for (const [name, version] of Object.entries({
      ...(pkg.dependencies ?? {}),
      ...(pkg.devDependencies ?? {}),
    }))
      if (version === 'latest')
        output.push(
          finding({
            externalId: `package-latest-${name}`,
            title: `${name} uses the floating latest tag`,
            category: 'dependencies',
            severity: 'medium',
            confidence: 1,
            filePath: 'package.json',
            evidence: `${name}: latest`,
            explanation:
              'The latest tag can resolve to a breaking version without a repository change.',
            deploymentImpact: 'Build behavior can change between deployments.',
            remediation: [`Pin ${name} to a reviewed compatible range.`],
            verificationSteps: [
              'Regenerate the lockfile and run the full test suite.',
            ],
          }),
        );
    return output;
  },
};

export const environmentAnalyzer: RepositoryAnalyzer = {
  id: 'environment',
  name: 'Environment and secrets',
  supports: () => true,
  async analyze(ctx) {
    const declared = new Set(
      (file(ctx, '.env.example')?.content ?? '')
        .split(/\r?\n/)
        .map((line) => line.split('=')[0].trim())
        .filter(Boolean),
    );
    const output: AnalyzerFinding[] = [];
    for (const name of ctx.manifest.environmentVariables) {
      if (!declared.has(name))
        output.push(
          finding({
            externalId: `env-undocumented-${name}`,
            title: `${name} is not documented`,
            category: 'environment',
            severity: /SECRET|TOKEN|KEY|DATABASE_URL/.test(name)
              ? 'high'
              : 'medium',
            confidence: 0.99,
            filePath: '.env.example',
            evidence: `${name} is referenced in source but absent from .env.example.`,
            explanation:
              'Required runtime configuration should be explicit and reproducible.',
            deploymentImpact:
              'Production may fail only after startup or return incorrect behavior.',
            remediation: [
              `Add ${name}= to .env.example without a real value.`,
              'Document whether it is required at build time or runtime.',
            ],
            verificationSteps: [
              'Start the application with a clean environment and the documented variables.',
            ],
          }),
        );
      if (
        name.startsWith('NEXT_PUBLIC_') &&
        /SECRET|TOKEN|PASSWORD|PRIVATE|DATABASE/.test(name)
      )
        output.push(
          finding({
            externalId: `env-public-secret-${name}`,
            title: 'Sensitive variable is exposed to browser code',
            category: 'security',
            severity: 'critical',
            confidence: 1,
            evidence: `${name} uses the NEXT_PUBLIC_ prefix.`,
            explanation:
              'Next.js includes NEXT_PUBLIC_* values in client bundles where every visitor can read them.',
            deploymentImpact:
              'A credential or privileged token can be disclosed publicly.',
            remediation: [
              'Rename the variable without NEXT_PUBLIC_.',
              'Read it only in server-side code.',
              'Rotate any value that has already been deployed.',
            ],
            verificationSteps: [
              'Search built client assets for the variable value.',
              'Confirm browser requests no longer contain it.',
            ],
          }),
        );
    }
    for (const envFile of ctx.files.filter(
      (item) => /^\.env(\.|$)/.test(item.path) && item.path !== '.env.example',
    ))
      output.push(
        finding({
          externalId: `env-committed-${envFile.path}`,
          title: 'Environment file appears to be committed',
          category: 'security',
          severity: 'critical',
          confidence: 0.95,
          filePath: envFile.path,
          evidence: `${envFile.path} is present in the repository tree.`,
          explanation:
            'Environment files frequently contain credentials and should not be versioned.',
          deploymentImpact:
            'Repository readers or downstream build logs may receive secrets.',
          remediation: [
            'Remove the file from version control.',
            'Rotate exposed values.',
            'Keep only a redacted .env.example.',
          ],
          verificationSteps: [
            'Confirm git history and the current tree contain no secret values.',
          ],
        }),
      );
    for (const source of ctx.files)
      if (
        /(sk-[A-Za-z0-9_-]{12,}|AKIA[0-9A-Z]{16}|ghp_[A-Za-z0-9]{20,})/.test(
          source.content,
        )
      )
        output.push(
          finding({
            externalId: `env-secret-like-${source.path}`,
            title: 'Secret-like value is present in repository text',
            category: 'security',
            severity: 'critical',
            confidence: 0.9,
            filePath: source.path,
            evidence:
              'A credential-shaped value was detected and redacted from analysis output.',
            explanation:
              'Even placeholders that resemble live secrets normalize unsafe handling and may be mistaken for valid credentials.',
            deploymentImpact:
              'A real leaked credential could permit unauthorized access.',
            remediation: [
              'Replace the value with an environment-variable reference.',
              'Rotate it if it was ever valid.',
            ],
            verificationSteps: [
              'Run a repository secret scan.',
              'Confirm the application reads the value server-side.',
            ],
          }),
        );
    return output;
  },
};

export const dockerAnalyzer: RepositoryAnalyzer = {
  id: 'docker',
  name: 'Docker',
  supports: (ctx) => ctx.files.some((item) => /^Dockerfile/.test(item.path)),
  async analyze(ctx) {
    const docker = ctx.files.find((item) => /^Dockerfile/.test(item.path));
    if (!docker) return [];
    const output: AnalyzerFinding[] = [];
    if (!ctx.files.some((item) => item.path === '.dockerignore'))
      output.push(
        finding({
          externalId: 'docker-ignore',
          title: '.dockerignore is missing',
          category: 'docker',
          severity: 'medium',
          confidence: 1,
          evidence: 'No .dockerignore file was found.',
          explanation:
            'Unbounded build contexts can include local secrets, dependencies, and large artifacts.',
          deploymentImpact:
            'Builds become slower and may copy sensitive files into intermediate layers.',
          remediation: [
            'Add .dockerignore entries for node_modules, .next, .git, logs, and .env files.',
          ],
          verificationSteps: ['Inspect the container build context size.'],
        }),
      );
    if (!/^USER\s+/m.test(docker.content))
      output.push(
        finding({
          externalId: 'docker-root',
          title: 'Container runs as root',
          category: 'docker',
          severity: 'high',
          confidence: 0.99,
          filePath: docker.path,
          evidence: 'No USER instruction is present.',
          explanation:
            'The default container user is root, increasing the impact of an application compromise.',
          deploymentImpact:
            'An exploited process receives unnecessary filesystem and runtime privileges.',
          remediation: [
            'Create or use a non-root runtime user.',
            'Copy only the files that user needs.',
          ],
          verificationSteps: [
            'Run id inside the built container and confirm a non-zero UID.',
          ],
        }),
      );
    if ((docker.content.match(/^FROM\s+/gm) ?? []).length < 2)
      output.push(
        finding({
          externalId: 'docker-single-stage',
          title: 'Production image is not multi-stage',
          category: 'docker',
          severity: 'medium',
          confidence: 0.95,
          filePath: docker.path,
          evidence: 'The Dockerfile contains a single FROM instruction.',
          explanation:
            'A single-stage Next.js image commonly ships build tools and source that are not needed at runtime.',
          deploymentImpact:
            'The image is larger, slower to pull, and has a broader attack surface.',
          remediation: [
            'Use dependency, build, and minimal runtime stages.',
            'Enable Next.js standalone output.',
          ],
          verificationSteps: [
            'Build the image and inspect its size and runtime contents.',
          ],
        }),
      );
    if (
      /FROM\s+[^\s:]+:latest/i.test(docker.content) ||
      /FROM\s+node\s*$/im.test(docker.content)
    )
      output.push(
        finding({
          externalId: 'docker-latest',
          title: 'Container base image is not pinned',
          category: 'docker',
          severity: 'high',
          confidence: 1,
          filePath: docker.path,
          evidence: 'The base image uses latest or omits a version tag.',
          explanation:
            'A floating base can change the Node runtime and operating system between builds.',
          deploymentImpact:
            'A previously working release can fail without a source change.',
          remediation: ['Pin a supported Node 20 image tag.'],
          verificationSteps: [
            'Rebuild twice from a clean cache and compare the selected base digest.',
          ],
        }),
      );
    if (/COPY\s+\.env/i.test(docker.content))
      output.push(
        finding({
          externalId: 'docker-copy-env',
          title: 'Dockerfile copies an environment file',
          category: 'security',
          severity: 'critical',
          confidence: 1,
          filePath: docker.path,
          evidence: 'A COPY instruction targets .env.',
          explanation:
            'Copied environment files persist in image layers even when deleted later.',
          deploymentImpact:
            'Anyone who can pull the image may recover embedded credentials.',
          remediation: [
            'Remove the COPY instruction.',
            'Inject runtime secrets through the deployment platform.',
          ],
          verificationSteps: [
            'Inspect image history and rebuild after rotating secrets.',
          ],
        }),
      );
    return output;
  },
};

export const nextAnalyzer: RepositoryAnalyzer = {
  id: 'nextjs',
  name: 'Next.js',
  supports: (ctx) => ctx.manifest.framework === 'Next.js',
  async analyze(ctx) {
    const output: AnalyzerFinding[] = [];
    const config = ctx.files.find((item) => /^next\.config\./.test(item.path));
    if (
      ctx.manifest.detectedTargets.includes('docker') &&
      !config?.content.includes('standalone')
    )
      output.push(
        finding({
          externalId: 'next-standalone',
          title: 'Standalone output is not enabled for Docker',
          category: 'docker',
          severity: 'low',
          confidence: 0.86,
          filePath: config?.path ?? 'next.config.mjs',
          evidence:
            'Docker is detected but output: standalone is not configured.',
          explanation:
            'Standalone output is a recommended Next.js production pattern for smaller, clearer runtime images.',
          deploymentImpact:
            'Container packaging is more error-prone and may copy unnecessary dependencies.',
          remediation: ['Set output: "standalone" in Next.js configuration.'],
          verificationSteps: [
            'Run next build and verify .next/standalone exists.',
          ],
        }),
      );
    for (const route of ctx.files.filter((item) =>
      /\/api\/.*route\.(ts|js)$/.test(item.path),
    ))
      if (!/z\.|safeParse|parse\(|schema/i.test(route.content))
        output.push(
          finding({
            externalId: `next-api-validation-${route.path}`,
            title: 'API route lacks visible runtime input validation',
            category: 'security',
            severity: 'high',
            confidence: 0.78,
            filePath: route.path,
            evidence:
              'The route reads request data without a visible validation schema.',
            explanation:
              'TypeScript types disappear at runtime; untrusted request bodies need explicit validation.',
            deploymentImpact:
              'Malformed input can trigger crashes, unsafe writes, or inconsistent behavior.',
            remediation: [
              'Validate the request body with a strict Zod schema.',
              'Return a stable 400 error for invalid input.',
            ],
            verificationSteps: [
              'Send malformed, missing, and extra fields to the route.',
            ],
          }),
        );
    for (const client of ctx.files.filter(
      (item) =>
        item.content.startsWith("'use client'") ||
        item.content.startsWith('"use client"'),
    ))
      if (/process\.env\.(?!NEXT_PUBLIC_)[A-Z0-9_]+/.test(client.content))
        output.push(
          finding({
            externalId: `next-client-secret-${client.path}`,
            title:
              'Client component references a server-only environment variable',
            category: 'environment',
            severity: 'high',
            confidence: 0.9,
            filePath: client.path,
            evidence:
              'A client component reads process.env without a NEXT_PUBLIC_ prefix.',
            explanation:
              'Server-only values are not reliably available in browser bundles and should remain behind a server boundary.',
            deploymentImpact:
              'The feature may fail in production or encourage unsafe public exposure.',
            remediation: [
              'Move the access to a server component or route handler.',
            ],
            verificationSteps: [
              'Inspect the production browser bundle and exercise the feature.',
            ],
          }),
        );
    return output;
  },
};

export const typescriptAnalyzer: RepositoryAnalyzer = {
  id: 'typescript',
  name: 'TypeScript',
  supports: (ctx) => Boolean(file(ctx, 'tsconfig.json')),
  async analyze(ctx) {
    const tsconfig = file(ctx, 'tsconfig.json');
    if (!tsconfig) return [];
    let config: {
      compilerOptions?: {
        strict?: boolean;
        skipLibCheck?: boolean;
        noImplicitAny?: boolean;
      };
    } = {};
    try {
      config = JSON.parse(tsconfig.content);
    } catch {
      return [
        finding({
          externalId: 'tsconfig-invalid',
          title: 'tsconfig.json cannot be parsed',
          category: 'build',
          severity: 'high',
          confidence: 1,
          filePath: 'tsconfig.json',
          evidence: 'The TypeScript configuration is invalid JSON.',
          explanation: 'The compiler cannot consistently validate the project.',
          deploymentImpact: 'Type checking and framework builds may fail.',
          remediation: ['Repair tsconfig.json.'],
          verificationSteps: ['Run tsc --noEmit.'],
        }),
      ];
    }
    const output: AnalyzerFinding[] = [];
    if (!config.compilerOptions?.strict)
      output.push(
        finding({
          externalId: 'ts-strict',
          title: 'TypeScript strict mode is disabled',
          category: 'build',
          severity: 'medium',
          confidence: 1,
          filePath: 'tsconfig.json',
          evidence: 'compilerOptions.strict is not true.',
          explanation:
            'Strict mode catches nullability, unsafe assumptions, and weak boundaries before deployment.',
          deploymentImpact:
            'Production-only type mistakes are more likely to escape review.',
          remediation: [
            'Enable strict mode and repair reported errors incrementally.',
          ],
          verificationSteps: ['Run tsc --noEmit.'],
        }),
      );
    return output;
  },
};

export const ciAnalyzer: RepositoryAnalyzer = {
  id: 'cicd',
  name: 'GitHub Actions',
  supports: () => true,
  async analyze(ctx) {
    const workflows = ctx.files.filter((item) =>
      /^\.github\/workflows\/.*\.ya?ml$/.test(item.path),
    );
    if (!workflows.length)
      return [
        finding({
          externalId: 'ci-missing',
          title: 'No CI workflow is configured',
          category: 'cicd',
          severity: 'high',
          confidence: 1,
          evidence: 'No files were found under .github/workflows.',
          explanation:
            'A repeatable validation gate is essential before production deployment.',
          deploymentImpact:
            'Broken builds and tests can reach the deployment branch unchecked.',
          remediation: [
            'Add a pull-request workflow that installs, lints, type-checks, tests, and builds.',
          ],
          verificationSteps: [
            'Open a pull request and confirm every validation job runs.',
          ],
        }),
      ];
    const output: AnalyzerFinding[] = [];
    for (const workflow of workflows) {
      const text = workflow.content.toLowerCase();
      for (const [term, label] of [
        ['npm run build', 'build'],
        ['typecheck', 'type check'],
        ['npm test', 'test'],
      ] as const)
        if (!text.includes(term))
          output.push(
            finding({
              externalId: `ci-missing-${label}-${workflow.path}`,
              title: `CI workflow does not run ${label}`,
              category: 'cicd',
              severity: label === 'build' ? 'high' : 'medium',
              confidence: 0.94,
              filePath: workflow.path,
              evidence: `No ${label} command was detected.`,
              explanation: `The workflow can report success without proving the ${label} gate.`,
              deploymentImpact: 'Invalid code may be deployed.',
              remediation: [
                `Add the project ${label} command before deployment.`,
              ],
              verificationSteps: [
                'Run the workflow on a pull request containing a deliberate failure.',
              ],
            }),
          );
      const deployIndex = text.search(/deploy|vercel|aws-actions/);
      const testIndex = text.search(/npm test|typecheck|npm run build/);
      if (deployIndex >= 0 && (testIndex < 0 || deployIndex < testIndex))
        output.push(
          finding({
            externalId: `ci-deploy-order-${workflow.path}`,
            title: 'Deployment can run before validation',
            category: 'cicd',
            severity: 'critical',
            confidence: 0.9,
            filePath: workflow.path,
            evidence:
              'A deployment step appears before build, type-check, or test validation.',
            explanation:
              'Release workflows should fail closed: validation must succeed before any deployment action.',
            deploymentImpact:
              'Known-bad code can reach production before CI detects it.',
            remediation: [
              'Move deployment into a job that depends on all validation jobs.',
            ],
            verificationSteps: [
              'Break a test and confirm no deployment step starts.',
            ],
          }),
        );
      if (/permissions:\s*write-all/.test(text))
        output.push(
          finding({
            externalId: `ci-permissions-${workflow.path}`,
            title: 'Workflow grants broad write permissions',
            category: 'security',
            severity: 'high',
            confidence: 0.95,
            filePath: workflow.path,
            evidence: 'permissions: write-all is configured.',
            explanation:
              'Broad token permissions magnify the impact of a compromised action or pull-request workflow.',
            deploymentImpact:
              'An attacker may modify repository contents or releases.',
            remediation: ['Grant only the permissions each job requires.'],
            verificationSteps: [
              'Inspect the workflow token permissions in a test run.',
            ],
          }),
        );
    }
    return output;
  },
};

export const prismaAnalyzer: RepositoryAnalyzer = {
  id: 'prisma',
  name: 'Prisma and database',
  supports: (ctx) => Boolean(file(ctx, 'prisma/schema.prisma')),
  async analyze(ctx) {
    const pkg = packageJson(ctx);
    const output: AnalyzerFinding[] = [];
    for (const [name, command] of Object.entries(pkg?.scripts ?? {}))
      if (/prod|deploy|start/.test(name) && /prisma\s+db\s+push/.test(command))
        output.push(
          finding({
            externalId: `prisma-db-push-${name}`,
            title: 'Production script uses prisma db push',
            category: 'database',
            severity: 'critical',
            confidence: 1,
            filePath: 'package.json',
            evidence: `${name}: ${command}`,
            explanation:
              'db push bypasses migration history and is not a controlled production schema rollout.',
            deploymentImpact:
              'Production schema changes can drift, fail irreversibly, or be difficult to roll back.',
            remediation: [
              'Create reviewed migrations.',
              'Use prisma migrate deploy in production.',
            ],
            verificationSteps: [
              'Apply migrations to an empty test database.',
              'Apply them to a production-like snapshot.',
            ],
          }),
        );
    if (
      !Object.values(pkg?.scripts ?? {}).some((command) =>
        /prisma\s+(generate|migrate)/.test(command),
      )
    )
      output.push(
        finding({
          externalId: 'prisma-generate',
          title: 'Prisma generation is not part of project scripts',
          category: 'database',
          severity: 'high',
          confidence: 0.92,
          filePath: 'package.json',
          evidence:
            'No Prisma generate or migrate command was found in scripts.',
          explanation:
            'Fresh CI and deployment environments need an explicit client-generation and migration path.',
          deploymentImpact:
            'Builds can fail with a missing or stale Prisma client.',
          remediation: [
            'Add prisma generate to the build lifecycle.',
            'Add a separate production migration command.',
          ],
          verificationSteps: [
            'Run installation and build from a clean checkout.',
          ],
        }),
      );
    return output;
  },
};

export const documentationAnalyzer: RepositoryAnalyzer = {
  id: 'documentation',
  name: 'Documentation',
  supports: () => true,
  async analyze(ctx) {
    const readme = ctx.files.find((item) => /^README\.md$/i.test(item.path));
    if (!readme)
      return [
        finding({
          externalId: 'docs-readme',
          title: 'README is missing',
          category: 'documentation',
          severity: 'medium',
          confidence: 1,
          evidence: 'No root README.md was found.',
          explanation:
            'A deployment-ready repository needs reproducible setup, validation, and release guidance.',
          deploymentImpact: 'Operators must guess critical production steps.',
          remediation: [
            'Add setup, environment, test, deployment, and troubleshooting sections.',
          ],
          verificationSteps: ['Follow the README from a clean checkout.'],
        }),
      ];
    const output: AnalyzerFinding[] = [];
    for (const [term, title] of [
      ['deploy', 'Deployment instructions are missing'],
      ['environment', 'Environment-variable documentation is missing'],
      ['test', 'Test instructions are missing'],
      ['troubleshoot', 'Troubleshooting guidance is missing'],
    ] as const)
      if (!readme.content.toLowerCase().includes(term))
        output.push(
          finding({
            externalId: `docs-${term}`,
            title,
            category: 'documentation',
            severity: 'low',
            confidence: 0.85,
            filePath: readme.path,
            evidence: `README.md does not contain a ${term} section or reference.`,
            explanation:
              'Release operations should be documented alongside the code they affect.',
            deploymentImpact:
              'Setup and incident recovery take longer and become inconsistent.',
            remediation: [`Add concise ${term} guidance to README.md.`],
            verificationSteps: [
              'Ask a teammate to follow the documented steps from a clean checkout.',
            ],
          }),
        );
    return output;
  },
};

export const vercelAnalyzer: RepositoryAnalyzer = {
  id: 'vercel',
  name: 'Vercel',
  supports: (ctx) =>
    ctx.manifest.detectedTargets.includes('vercel') ||
    ctx.manifest.framework === 'Next.js',
  async analyze(ctx) {
    const output: AnalyzerFinding[] = [];
    for (const source of ctx.files)
      if (
        /writeFile|appendFile|createWriteStream/.test(source.content) &&
        !/\/tmp/.test(source.content)
      )
        output.push(
          finding({
            externalId: `vercel-file-write-${source.path}`,
            title: 'Application writes to the local filesystem',
            category: 'vercel',
            severity: 'high',
            confidence: 0.84,
            filePath: source.path,
            evidence:
              'A filesystem write API is used outside an explicit temporary directory.',
            explanation:
              'Vercel function filesystems are ephemeral and should not be used as durable application storage.',
            deploymentImpact:
              'Written data can disappear between requests or instances.',
            remediation: [
              'Store durable data in PostgreSQL or object storage.',
              'Use /tmp only for request-scoped temporary files.',
            ],
            verificationSteps: [
              'Exercise the feature across separate deployments or instances.',
            ],
          }),
        );
    return output;
  },
};

export const awsAnalyzer: RepositoryAnalyzer = {
  id: 'aws',
  name: 'AWS heuristics',
  supports: (ctx) => ctx.manifest.detectedTargets.includes('aws'),
  async analyze(ctx) {
    const output: AnalyzerFinding[] = [];
    for (const source of ctx.files) {
      if (/AKIA[0-9A-Z]{16}/.test(source.content))
        output.push(
          finding({
            externalId: `aws-key-${source.path}`,
            title: 'Hard-coded AWS access key detected',
            category: 'aws',
            severity: 'critical',
            confidence: 0.98,
            filePath: source.path,
            evidence:
              'An AWS access-key-shaped value was detected and redacted.',
            explanation:
              'Long-lived cloud credentials must not be stored in source.',
            deploymentImpact:
              'The key may allow unauthorized cloud actions and cost exposure.',
            remediation: [
              'Revoke the key.',
              'Use short-lived workload identity or environment configuration.',
            ],
            verificationSteps: [
              'Check CloudTrail and repository history after revocation.',
            ],
          }),
        );
      if (
        /Action:\s*["']?\*["']?|Resource:\s*["']?\*["']?/i.test(source.content)
      )
        output.push(
          finding({
            externalId: `aws-iam-${source.path}`,
            title: 'AWS policy example is overly broad',
            category: 'aws',
            severity: 'high',
            confidence: 0.82,
            filePath: source.path,
            evidence: 'An IAM Action or Resource wildcard was found.',
            explanation:
              'Wildcard permissions should be narrowed to the exact deployment operations and resources.',
            deploymentImpact:
              'A compromised workload can affect unrelated cloud resources.',
            remediation: [
              'Replace wildcards with required actions and scoped ARNs.',
            ],
            verificationSteps: [
              'Use IAM Access Analyzer to validate the policy.',
            ],
          }),
        );
    }
    return output;
  },
};

export const analyzers: RepositoryAnalyzer[] = [
  packageAnalyzer,
  environmentAnalyzer,
  dockerAnalyzer,
  nextAnalyzer,
  typescriptAnalyzer,
  ciAnalyzer,
  prismaAnalyzer,
  documentationAnalyzer,
  vercelAnalyzer,
  awsAnalyzer,
];

export async function runAnalyzers(
  context: RepositoryContext,
): Promise<AnalyzerFinding[]> {
  const batches = await Promise.all(
    analyzers
      .filter((analyzer) => analyzer.supports(context))
      .map((analyzer) => analyzer.analyze(context)),
  );
  return batches.flat();
}
