import type { Location } from '@e18e/deopt-shared';

export function keyLocation({ functionName, line, column }: Location): string {
  // need to customize key since Objects get different key
  // per instance even if line + column are the same
  return `${functionName}:${line}:${column}`;
}

export function unkeyLocation(
  key: string | null,
): Omit<Location, 'file'> | null {
  if (key === null) return null;
  const [functionName, line, column] = key.split(':');
  return { functionName, line: parseInt(line), column: parseInt(column) };
}

export function byLocation(
  a: Omit<Location, 'file'>,
  b: Omit<Location, 'file'>,
): number {
  if (a.line < b.line) return -1;
  if (a.line > b.line) return 1;
  if (a.column < b.column) return -1;
  if (a.column > b.column) return 1;
  return 0;
}

export function byLocationKey(ka: string, kb: string): number {
  const a = unkeyLocation(ka);
  const b = unkeyLocation(kb);
  if (a === null || b === null) return 0;
  return byLocation(a, b);
}
