import { PrismaClient } from '@prisma/client';

const globalPrisma = globalThis as typeof globalThis & {
  __launchguardPrisma?: PrismaClient;
};
export const prisma = globalPrisma.__launchguardPrisma ?? new PrismaClient();
if (process.env.NODE_ENV !== 'production')
  globalPrisma.__launchguardPrisma = prisma;
