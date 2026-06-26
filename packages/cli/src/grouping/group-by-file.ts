import type {
  ParsedIcInfo,
  ParsedDeoptInfo,
  ParsedCodeInfo,
} from '@e18e/deopt-shared';
import type { LogData, FileGroup, ResolvedFile } from '../types.js';

const ispawnRx = /ispawn\/preload\/\S+\.js$/;

function ignoreFile(files: Map<string, ResolvedFile>, file: string): boolean {
  // For now we only include user code for which we resolved the file
  // Additionally we ignore files that were used by ispawn to control the process
  return !files.has(file) || ispawnRx.test(file);
}

function getOrCreateFileGroup(
  files: Map<string, ResolvedFile>,
  groups: Map<string, FileGroup>,
  file: string,
): FileGroup {
  let group = groups.get(file);
  if (group === undefined) {
    group = {
      ics: [],
      deopts: [],
      codes: [],
      fullPath: '',
      relativePath: '',
      src: '',
      ...files.get(file),
    };
    groups.set(file, group);
  }
  return group;
}

function handleDataPoints(
  groups: Map<string, FileGroup>,
  files: Map<string, ResolvedFile>,
  dataPoints: Array<ParsedIcInfo | ParsedDeoptInfo | ParsedCodeInfo>,
  key: 'ics' | 'deopts' | 'codes',
): void {
  for (const dataPoint of dataPoints) {
    const { file } = dataPoint;
    if (ignoreFile(files, file)) continue;
    const group = getOrCreateFileGroup(files, groups, file);
    // TODO: revisit, the key/value relationship is lost here
    (group[key] as Array<ParsedIcInfo | ParsedDeoptInfo | ParsedCodeInfo>).push(
      dataPoint,
    );
  }
}

export function groupByFile(
  data: LogData,
  files: Map<string, ResolvedFile>,
): Map<string, FileGroup> {
  const { ics, deopts, codes } = data;
  const groups = new Map<string, FileGroup>();
  handleDataPoints(groups, files, ics, 'ics');
  handleDataPoints(groups, files, deopts, 'deopts');
  handleDataPoints(groups, files, codes, 'codes');
  return groups;
}
