export function validateUnifiedDiff(
  diff: string,
  allowedPaths: string[],
): boolean {
  if (!diff.trim() || !/^--- a\/[^\n]+\n\+\+\+ b\/[^\n]+/m.test(diff))
    return false;
  if (diff.includes('[REDACTED]')) return false;
  const paths = [
    ...diff.matchAll(/^--- a\/(.+)$/gm),
    ...diff.matchAll(/^\+\+\+ b\/(.+)$/gm),
  ].map((match) => match[1].trim());
  return (
    paths.length >= 2 && paths.every((path) => allowedPaths.includes(path))
  );
}
