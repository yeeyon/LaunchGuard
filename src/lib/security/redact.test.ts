import { describe, expect, it } from 'vitest';
import {
  extractEnvironmentVariables,
  looksBinary,
  redactSecrets,
} from './redact';

describe('redaction', () => {
  it('redacts key-shaped values while preserving names', () => {
    const result = redactSecrets(
      'OPENAI_API_KEY=sk-12345678901234567890\nBearer abcdefghijklmnop',
    );
    expect(result).toContain('OPENAI_API_KEY=[REDACTED]');
    expect(result).not.toContain('sk-12345678901234567890');
    expect(result).not.toContain('abcdefghijklmnop');
  });
  it('redacts every .env value', () => {
    expect(
      redactSecrets('DATABASE_URL=postgres://user:pass@host/db', '.env'),
    ).toBe('DATABASE_URL=[REDACTED]');
  });
  it('extracts environment names and detects binary content', () => {
    expect(
      extractEnvironmentVariables([
        {
          path: 'src/a.ts',
          content: 'process.env.DATABASE_URL; import.meta.env.NEXT_PUBLIC_APP',
        },
      ]),
    ).toEqual(['DATABASE_URL', 'NEXT_PUBLIC_APP']);
    expect(looksBinary('a\u0000b')).toBe(true);
  });
});
