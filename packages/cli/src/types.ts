import type {
  ParsedIcInfo,
  ParsedDeoptInfo,
  ParsedCodeInfo,
  Group,
} from '@e18e/deopt-shared';

/** The parsed diagnostics extracted from a log, before grouping. */
export interface LogData {
  ics: ParsedIcInfo[];
  deopts: ParsedDeoptInfo[];
  codes: ParsedCodeInfo[];
  root: string;
}

/** A source file resolved on disk. */
export interface ResolvedFile {
  fullPath: string;
  relativePath: string;
  src: string;
}

/** A file's parsed diagnostics grouped by kind, keyed by file path. */
export interface FileGroup extends ResolvedFile {
  ics: ParsedIcInfo[];
  deopts: ParsedDeoptInfo[];
  codes: ParsedCodeInfo[];
}

/**
 * A resolved source file paired with its processed diagnostics: the shared
 * `Group` (diagnostics keyed by location, the sorted location keys for each
 * kind and the per-file summary) plus the file's path and source.
 */
export interface RenderGroup extends Group, ResolvedFile {}
