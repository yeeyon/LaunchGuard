import { z } from 'zod';
import { categoryValues, severityValues } from '@/types/domain';

export const aiAnalysisSchema = z.object({
  repositorySummary: z.string(),
  deploymentSummary: z.string(),
  architectureObservations: z.array(z.string()),
  findings: z.array(
    z.object({
      externalId: z.string(),
      title: z.string(),
      category: z.enum(categoryValues),
      severity: z.enum(severityValues),
      confidence: z.number().min(0).max(1),
      filePath: z.string().optional(),
      lineStart: z.number().int().positive().optional(),
      lineEnd: z.number().int().positive().optional(),
      evidence: z.string(),
      explanation: z.string(),
      deploymentImpact: z.string(),
      remediation: z.array(z.string()),
      verificationSteps: z.array(z.string()),
      patchCandidate: z
        .object({ summary: z.string(), unifiedDiff: z.string() })
        .optional(),
    }),
  ),
  releaseBlockers: z.array(z.string()),
  quickWins: z.array(z.string()),
  deploymentChecklist: z.array(z.string()),
});
export type AIAnalysis = z.infer<typeof aiAnalysisSchema>;
