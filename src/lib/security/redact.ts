const SECRET_PATTERNS: RegExp[] = [
  /(sk-[A-Za-z0-9_-]{12,})/g,
  /(AKIA[0-9A-Z]{16})/g,
  /(gh[pousr]_[A-Za-z0-9_]{20,})/g,
  /(Bearer\s+)[A-Za-z0-9._~+/=-]+/gi,
  /(-----BEGIN [A-Z ]+ PRIVATE KEY-----)[\s\S]*?(-----END [A-Z ]+ PRIVATE KEY-----)/g,
  /(postgres(?:ql)?:\/\/[^\s"']+)/gi,
];

const SECRET_KEY =
  /(password|passwd|secret|token|api[_-]?key|private[_-]?key|access[_-]?key|database[_-]?url|cookie)/i;

export function redactSecrets(input: string, filePath?: string): string {
  let output = input;
  for (const pattern of SECRET_PATTERNS) {
    output = output.replace(pattern, (match, prefix?: string) =>
      prefix ? `${prefix}[REDACTED]` : '[REDACTED]',
    );
  }
  if (filePath?.startsWith('.env') || filePath?.includes('/.env')) {
    output = output
      .split(/\r?\n/)
      .map((line) => {
        const index = line.indexOf('=');
        return index > 0 && !line.trim().startsWith('#')
          ? `${line.slice(0, index + 1)}[REDACTED]`
          : line;
      })
      .join('\n');
  }
  output = output.replace(
    /(["']?([A-Z][A-Z0-9_]*(?:SECRET|TOKEN|PASSWORD|KEY|URL))["']?\s*[:=]\s*["']?)([^\s,"'}]+)/g,
    '$1[REDACTED]',
  );
  return output;
}

export function looksBinary(buffer: Buffer | string): boolean {
  const value = typeof buffer === 'string' ? buffer : buffer.toString('utf8');
  return value.includes('\u0000');
}

export function extractEnvironmentVariables(
  files: Array<{ path: string; content: string }>,
): string[] {
  const names = new Set<string>();
  for (const file of files) {
    if (file.path.startsWith('.env')) continue;
    for (const match of file.content.matchAll(
      /process\.env\.([A-Z][A-Z0-9_]*)|import\.meta\.env\.([A-Z][A-Z0-9_]*)/g,
    ))
      names.add(match[1] ?? match[2]);
  }
  return [...names].sort();
}
