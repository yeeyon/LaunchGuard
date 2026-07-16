import { z } from 'zod';

export const repositoryInputSchema = z.object({
  repositoryUrl: z.string().trim().url(),
  branch: z.string().trim().max(120).optional().or(z.literal('')),
  target: z.enum(['auto', 'vercel', 'docker', 'aws', 'node']).default('auto'),
});

export interface NormalizedRepositoryUrl {
  owner: string;
  name: string;
  url: string;
}

export function normalizeGithubUrl(value: string): NormalizedRepositoryUrl {
  const parsed = new URL(value.trim());
  if (
    parsed.protocol !== 'https:' ||
    parsed.hostname.toLowerCase() !== 'github.com'
  ) {
    throw new Error('Only public GitHub HTTPS URLs are supported.');
  }
  const segments = parsed.pathname.split('/').filter(Boolean);
  if (segments.length !== 2)
    throw new Error(
      'Use a GitHub URL in the form https://github.com/owner/repository.',
    );
  const owner = segments[0];
  const name = segments[1].replace(/\.git$/i, '');
  if (!/^[A-Za-z0-9_.-]+$/.test(owner) || !/^[A-Za-z0-9_.-]+$/.test(name))
    throw new Error('That GitHub repository name is not valid.');
  return { owner, name, url: `https://github.com/${owner}/${name}` };
}
