import path from 'node:path';

import { processLogContent } from '@e18e/deopt-processor';
import { lineReader } from './line-reader.js';
import { groupByFile } from './grouping/group-by-file.js';
import { resolveFiles } from './grouping/resolve-files.js';
import type { FileGroup } from './types.js';

interface ProcessLogOptions {
  icStateChangesOnly?: boolean;
  root?: string;
}

async function extractDataFromLog(
  p: string,
  { icStateChangesOnly, root }: ProcessLogOptions,
) {
  const lines = lineReader(p, 'utf-8');
  const resolvedRoot = root === undefined ? path.dirname(p) : root;
  const processed = await processLogContent(lines, resolvedRoot);
  if (icStateChangesOnly) processed.filterIcStateChanges();
  return processed;
}

export async function processLog(
  p: string,
  { icStateChangesOnly = true, root }: ProcessLogOptions = {},
): Promise<Map<string, FileGroup>> {
  const extracted = await extractDataFromLog(p, { icStateChangesOnly, root });
  const data = extracted.toParsed();
  const files = await resolveFiles(data);
  const groupedByFile = groupByFile(data, files);
  return groupedByFile;
}

export async function logToJSON(
  p: string,
  { icStateChangesOnly = true, root }: ProcessLogOptions = {},
): Promise<string> {
  const groupedByFile = await processLog(p, { icStateChangesOnly, root });
  return JSON.stringify(Array.from(groupedByFile), null, 2);
}
