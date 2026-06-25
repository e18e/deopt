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

/** A single inline-cache state transition recorded for an IC location. */
export interface IcUpdate {
  type: string;
  oldState: number;
  newState: number;
  key: string;
  map: string;
  optimizationState: number;
  severity: Severity;
  oldStateName: string;
  oldStateSeverity: Severity;
  newStateName: string;
  newStateSeverity: Severity;
}

/** A single deoptimization event recorded for a deopt location. */
export interface DeoptUpdate {
  timestamp: number;
  bailoutType: string;
  deoptReason: string;
  optimizationState: number;
  inlined: boolean;
  severity: Severity;
}

/** A single optimization-state transition recorded for a code location. */
export interface CodeUpdate {
  timestamp: number;
  state: number;
  severity: Severity;
  stateName: string;
}

/** An inline-cache diagnostic grouped at a single location. */
export interface IcInfo extends Location {
  id: number;
  severity: Severity;
  updates: IcUpdate[];
}

/** A deoptimization diagnostic grouped at a single location. */
export interface DeoptInfo extends Location {
  id: number;
  severity: Severity;
  updates: DeoptUpdate[];
}

/** An optimization (code) diagnostic grouped at a single location. */
export interface CodeInfo extends Location {
  id: number;
  severity: Severity;
  isScript: boolean;
  updates: CodeUpdate[];
}

/** Any diagnostic vector, regardless of kind. */
export type Info = IcInfo | DeoptInfo | CodeInfo;

/** Any single update entry, regardless of kind. */
export type Update = IcUpdate | DeoptUpdate | CodeUpdate;

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
  ics: Map<string, IcInfo>;
  deopts: Map<string, DeoptInfo>;
  codes: Map<string, CodeInfo>;
  icLocations: string[];
  deoptLocations: string[];
  codeLocations: string[];
  summary: FileSummary;
}

/** Discriminator distinguishing the three diagnostic kinds. */
export type DiagnosticKind = 'ic' | 'deopt' | 'code';

/** A diagnostic paired with its kind, as listed for a file. */
export type Diagnostic =
  | { kind: 'ic'; info: IcInfo }
  | { kind: 'deopt'; info: DeoptInfo }
  | { kind: 'code'; info: CodeInfo };
