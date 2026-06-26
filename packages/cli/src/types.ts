import type {
  ParsedIcInfo,
  ParsedDeoptInfo,
  ParsedCodeInfo,
  ProcessedIcInfo,
  ProcessedDeoptInfo,
  ProcessedCodeInfo,
  FileSummary,
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
 * A file's processed diagnostics keyed by location, with the sorted location
 * keys for each kind and the precomputed per-file summary.
 */
export interface RenderGroup extends ResolvedFile {
  ics: Map<string, ProcessedIcInfo>;
  deopts: Map<string, ProcessedDeoptInfo>;
  codes: Map<string, ProcessedCodeInfo>;
  icLocations: string[];
  deoptLocations: string[];
  codeLocations: string[];
  summary?: FileSummary;
}
