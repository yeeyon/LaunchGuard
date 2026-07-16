import { describe, expect, it } from 'vitest';
import { normalizeGithubUrl } from './url';

describe('normalizeGithubUrl', () => {
  it.each([
    'https://github.com/acme/storefront',
    'https://github.com/acme/storefront/',
    'https://github.com/acme/storefront.git',
  ])('normalizes %s', (value) => {
    expect(normalizeGithubUrl(value)).toEqual({
      owner: 'acme',
      name: 'storefront',
      url: 'https://github.com/acme/storefront',
    });
  });
  it('rejects non-GitHub URLs', () => {
    expect(() =>
      normalizeGithubUrl('https://gitlab.com/acme/storefront'),
    ).toThrow();
  });
});
