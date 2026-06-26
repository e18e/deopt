import path from 'node:path';
import { access, readFile, stat } from 'node:fs/promises';
import fs from 'node:fs';
import type { LogData, ResolvedFile } from '../types.js';

async function canRead(p: string): Promise<boolean> {
  try {
    await access(p, fs.constants.R_OK);
    return true;
  } catch {
    return false;
  }
}

async function resolveAll(
  set: Set<string>,
  root: string,
): Promise<Map<string, ResolvedFile>> {
  const files = new Map<string, ResolvedFile>();
  for (const key of set) {
    const fullPath = path.resolve(root, key);
    const relativePath = path.relative(root, fullPath);
    if (!(await canRead(fullPath))) continue;
    if (!(await stat(fullPath)).isFile()) continue;
    const src = await readFile(fullPath, 'utf8');
    files.set(key, { fullPath, relativePath, src });
  }
  return files;
}

export async function resolveFiles(
  data: LogData,
): Promise<Map<string, ResolvedFile>> {
  const { ics, deopts, codes, root } = data;

  const filesSet = new Set(
    ics
      .map((x) => x.file)
      .concat(deopts.map((x) => x.file))
      .concat(codes.map((x) => x.file))
      .filter(Boolean),
  );
  const files = await resolveAll(filesSet, root);
  return files;
}
