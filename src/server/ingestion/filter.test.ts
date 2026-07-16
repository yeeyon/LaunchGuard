import { describe, expect, it } from 'vitest';
import { filterRepositoryFiles, shouldSkipPath } from './filter';

describe('repository file filtering', () => {
  it('skips generated and binary-like paths', () => {
    expect(shouldSkipPath('node_modules/pkg/index.js')).toBe(true);
    expect(shouldSkipPath('logo.png')).toBe(true);
  });
  it('prioritizes high-signal files under limits', () => {
    const files = [
      { path: 'src/a.ts', content: 'a', size: 1 },
      { path: 'package.json', content: '{}', size: 2 },
      { path: 'README.md', content: 'r', size: 1 },
    ];
    expect(
      filterRepositoryFiles(files, {
        maxFiles: 2,
        maxFileBytes: 10,
        maxTotalBytes: 10,
      }).map((file) => file.path),
    ).toEqual(['package.json', 'README.md']);
  });
});
