import { z } from 'zod';
import { categoryValues, severityValues } from '@/types/domain';

export const aiAnalysisSchema = z.object({
  repositorySummary: z.string().max(4000),
  deploymentSummary: z.string().max(4000),
  architectureObservations: z.array(z.string().max(1000)).max(20),
  findings: z
    .array(
      z.object({
        externalId: z.string().max(200),
        title: z.string().max(500),
        category: z.enum(categoryValues),
        severity: z.enum(severityValues),
        confidence: z.number().min(0).max(1),
        filePath: z.string().max(500).optional(),
        lineStart: z.number().int().positive().optional(),
        lineEnd: z.number().int().positive().optional(),
        evidence: z.string().max(4000),
        explanation: z.string().max(4000),
        deploymentImpact: z.string().max(2000),
        remediation: z.array(z.string().max(1000)).max(20),
        verificationSteps: z.array(z.string().max(1000)).max(20),
        patchCandidate: z
          .object({
            summary: z.string().max(500),
            unifiedDiff: z.string().max(50000),
          })
          .optional(),
      }),
    )
    .max(100),
  releaseBlockers: z.array(z.string().max(500)).max(50),
  quickWins: z.array(z.string().max(500)).max(50),
  deploymentChecklist: z.array(z.string().max(1000)).max(50),
});
export type AIAnalysis = z.infer<typeof aiAnalysisSchema>;
