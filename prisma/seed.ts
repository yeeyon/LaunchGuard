import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
async function main() {
  await prisma.scan.deleteMany({ where: { isDemo: true } });
  await prisma.scan.create({
    data: {
      repositoryName: 'broken-nextjs-app',
      repositoryOwner: 'launchguard',
      branch: 'main',
      framework: 'Next.js',
      packageManager: 'npm',
      isDemo: true,
      status: 'COMPLETE',
      score: 42,
      readinessStatus: 'Blocked',
      aiMode: 'SEEDED_AI',
      summary: 'Seed record for environments with PostgreSQL configured.',
      deploymentSummary:
        'Use the bundled demo scan to refresh a complete fixture report.',
    },
  });
}
main().finally(() => prisma.$disconnect());
