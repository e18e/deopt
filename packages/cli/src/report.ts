import {
  listDiagnostics,
  issueForDiagnostic,
  tipForDiagnostic,
} from '@e18e/deopt-shared';
import type { DiagnosticKind, Update } from '@e18e/deopt-shared';
import type { RenderGroup } from './types.js';

/** A single diagnostic location. */
export interface ReportDiagnostic {
  kind: DiagnosticKind;
  functionName: string;
  line: number;
  column: number;
  severity: number;
  /** Stable, concise label for the problem, e.g. "deopt: wrong call target". */
  issue: string;
  /** Actionable advice for the issue, when one is available. */
  tip: string | null;
  /** The raw state transitions backing this diagnostic. */
  updates: Update[];
}

/** A file and the diagnostics found in it. */
export interface ReportFile {
  file: string;
  diagnostics: ReportDiagnostic[];
}

export interface Report {
  files: ReportFile[];
}

interface ReportOptions {
  includeAllSeverities?: boolean;
  hideNodeModules?: boolean;
}

/**
 * Builds a structured report from enriched render data. By default it matches
 * the app's default view: files without critical severities and node_modules
 * are omitted, only severities above the baseline are listed, and files are
 * sorted from worst to least severe.
 */
export function buildReport(
  groups: Map<string, RenderGroup>,
  { includeAllSeverities = false, hideNodeModules = true }: ReportOptions = {},
): Report {
  const ranked: Array<{ score: number; file: ReportFile }> = [];
  for (const group of groups.values()) {
    const summary = group.summary;
    if (!includeAllSeverities && !summary.hasCriticalSeverities) continue;
    if (hideNodeModules && group.relativePath.includes('node_modules/'))
      continue;

    const diagnostics = listDiagnostics(group, { includeAllSeverities }).map(
      (diagnostic): ReportDiagnostic => ({
        kind: diagnostic.kind,
        functionName: diagnostic.info.functionName,
        line: diagnostic.info.line,
        column: diagnostic.info.column,
        severity: diagnostic.info.severity,
        issue: issueForDiagnostic(diagnostic),
        tip: tipForDiagnostic(diagnostic),
        updates: diagnostic.info.updates,
      }),
    );

    ranked.push({
      score: summary.severityScore,
      file: { file: group.relativePath, diagnostics },
    });
  }
  ranked.sort((a, b) => b.score - a.score);
  return { files: ranked.map((entry) => entry.file) };
}
