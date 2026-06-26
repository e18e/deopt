/**
 * A diagnostic severity. `MIN_SEVERITY` (1) is the baseline; higher numbers are
 * more severe. Computed values currently range from 1 to 3.
 */
export type Severity = number;

/** Source location shared by every diagnostic vector. */
export interface Location {
  functionName: string;
  file: string;
  line: number;
  column: number;
}

/**
 * Parsed data: the shapes produced directly from the v8 log, before they are
 * enriched into the processed (relational) shapes below.
 */

/** A single inline-cache state transition recorded for an IC location. */
export interface ParsedIcUpdate {
  type: string;
  oldState: number;
  newState: number;
  key: string;
  map: string;
  optimizationState: number;
  severity: Severity;
}

/** A single deoptimization event recorded for a deopt location. */
export interface ParsedDeoptUpdate {
  timestamp: number;
  bailoutType: string;
  deoptReason: string;
  optimizationState: number;
  inlined: boolean;
  severity: Severity;
}

/** A single optimization-state transition recorded for a code location. */
export interface ParsedCodeUpdate {
  timestamp: number;
  state: number;
  severity: Severity;
}

/** An inline-cache diagnostic grouped at a single location. */
export interface ParsedIcInfo extends Location {
  updates: ParsedIcUpdate[];
}

/** A deoptimization diagnostic grouped at a single location. */
export interface ParsedDeoptInfo extends Location {
  updates: ParsedDeoptUpdate[];
}

/** An optimization (code) diagnostic grouped at a single location. */
export interface ParsedCodeInfo extends Location {
  isScript: boolean;
  updates: ParsedCodeUpdate[];
}

/**
 * Processed data: the parsed shapes enriched with the fields that only exist
 * once diagnostics have been grouped and resolved (ids, per-vector severities
 * and the display names for each state).
 */

export interface ProcessedIcUpdate extends ParsedIcUpdate {
  oldStateName: string;
  oldStateSeverity: Severity;
  newStateName: string;
  newStateSeverity: Severity;
}

export type ProcessedDeoptUpdate = ParsedDeoptUpdate;

export interface ProcessedCodeUpdate extends ParsedCodeUpdate {
  stateName: string;
}

export interface ProcessedIcInfo extends ParsedIcInfo {
  id: number;
  severity: Severity;
  updates: ProcessedIcUpdate[];
}

export interface ProcessedDeoptInfo extends ParsedDeoptInfo {
  id: number;
  severity: Severity;
}

export interface ProcessedCodeInfo extends ParsedCodeInfo {
  id: number;
  severity: Severity;
  updates: ProcessedCodeUpdate[];
}

/** Any processed diagnostic vector, regardless of kind. */
export type Info = ProcessedIcInfo | ProcessedDeoptInfo | ProcessedCodeInfo;

/** Any single processed update entry, regardless of kind. */
export type Update =
  | ProcessedIcUpdate
  | ProcessedDeoptUpdate
  | ProcessedCodeUpdate;

/** Per-file severity rollup attached to a group. */
export interface FileSummary {
  icSeverities: number[];
  deoptSeverities: number[];
  codeSeverities: number[];
  codeStates: number[];
  severityScore: number;
  hasCriticalSeverities: boolean;
}

/**
 * A file group: diagnostics keyed by location, the sorted location keys for
 * each kind, and the precomputed per-file summary.
 */
export interface Group {
  ics: Map<string, ProcessedIcInfo>;
  deopts: Map<string, ProcessedDeoptInfo>;
  codes: Map<string, ProcessedCodeInfo>;
  icLocations: string[];
  deoptLocations: string[];
  codeLocations: string[];
  summary: FileSummary;
}

/** Discriminator distinguishing the three diagnostic kinds. */
export type DiagnosticKind = 'ic' | 'deopt' | 'code';

/** A diagnostic paired with its kind, as listed for a file. */
export type Diagnostic =
  | { kind: 'ic'; info: ProcessedIcInfo }
  | { kind: 'deopt'; info: ProcessedDeoptInfo }
  | { kind: 'code'; info: ProcessedCodeInfo };
