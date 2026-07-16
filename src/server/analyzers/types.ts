import type { AnalyzerFinding, RepositoryContext } from '@/types/domain';

export interface RepositoryAnalyzer {
  id: string;
  name: string;
  supports(context: RepositoryContext): boolean;
  analyze(context: RepositoryContext): Promise<AnalyzerFinding[]>;
}

export const file = (context: RepositoryContext, path: string) =>
  context.files.find((item) => item.path === path);
export const lineOf = (content: string | undefined, term: string) =>
  content
    ? content.split(/\r?\n/).findIndex((line) => line.includes(term)) + 1
    : undefined;
export const finding = (
  partial: Omit<AnalyzerFinding, 'source'>,
): AnalyzerFinding => ({ ...partial, source: 'deterministic' });
