export const severityValues = [
  'critical',
  'high',
  'medium',
  'low',
  'info',
] as const;
export type Severity = (typeof severityValues)[number];

export const categoryValues = [
  'build',
  'dependencies',
  'environment',
  'docker',
  'cicd',
  'security',
  'database',
  'vercel',
  'aws',
  'documentation',
  'performance',
] as const;
export type FindingCategory = (typeof categoryValues)[number];

export type FindingSource = 'deterministic' | 'ai' | 'seeded-ai';
export type ResolutionStatus = 'open' | 'reviewed' | 'resolved';
export type DeploymentTarget = 'auto' | 'vercel' | 'docker' | 'aws' | 'node';
export type ScanStatus =
  | 'pending'
  | 'collecting'
  | 'analyzing'
  | 'complete'
  | 'failed';

export interface RepositoryFile {
  path: string;
  content: string;
  size: number;
  language?: string;
}

export interface RepositoryManifest {
  owner: string;
  name: string;
  branch: string;
  commitSha?: string;
  framework: string;
  packageManager: string;
  runtime: string;
  importantFiles: string[];
  detectedTargets: DeploymentTarget[];
  environmentVariables: string[];
  scripts: Record<string, string>;
  dependencies: Record<string, string>;
  excerpts: Array<{ path: string; content: string }>;
}

export interface RepositoryContext {
  source: 'demo' | 'github';
  url?: string;
  owner: string;
  name: string;
  branch: string;
  files: RepositoryFile[];
  manifest: RepositoryManifest;
}

export interface PatchCandidate {
  summary: string;
  unifiedDiff: string;
}

export interface AnalyzerFinding {
  externalId: string;
  source: FindingSource;
  title: string;
  category: FindingCategory;
  severity: Severity;
  confidence: number;
  filePath?: string;
  lineStart?: number;
  lineEnd?: number;
  evidence: string;
  explanation: string;
  deploymentImpact: string;
  remediation: string[];
  verificationSteps: string[];
  patchCandidate?: PatchCandidate;
}

export interface ScanResult {
  id: string;
  status: ScanStatus;
  context: RepositoryContext;
  findings: AnalyzerFinding[];
  score: number;
  readinessStatus: 'Ready' | 'Needs attention' | 'High risk' | 'Blocked';
  summary: string;
  deploymentSummary: string;
  releaseBlockers: string[];
  quickWins: string[];
  deploymentChecklist: string[];
  aiMode: 'deterministic' | 'seeded' | 'live';
  aiModel?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StoredFinding extends AnalyzerFinding {
  id: string;
  resolutionStatus: ResolutionStatus;
}
