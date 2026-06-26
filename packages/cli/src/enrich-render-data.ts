import { groupByFileAndLocation } from './grouping/group-by-file-and-location.js';
import { summarizeFile } from './grouping/summarize-file.js';
import type { FileGroup, RenderGroup } from './types.js';

export function buildRenderData(
  groupedByFile: Map<string, FileGroup>,
): Map<string, RenderGroup> {
  const groups = groupByFileAndLocation(groupedByFile);
  for (const group of groups.values()) {
    group.summary = summarizeFile(group);
  }
  return groups;
}

export function serializeRenderData(groups: Map<string, RenderGroup>) {
  return Array.from(groups, ([file, group]) => [
    file,
    {
      ...group,
      ics: Array.from(group.ics),
      deopts: Array.from(group.deopts),
      codes: Array.from(group.codes),
    },
  ]);
}
