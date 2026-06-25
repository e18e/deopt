import * as ICState from './ic-state.js';
import type {
  Severity,
  CodeUpdate,
  Update,
  Group,
  Diagnostic,
} from './types.js';

export type * from './types.js';

export { ICState };

export const MIN_SEVERITY = 1;

export const severityColors = ['green', 'blue', 'dark-red'];

export function highestSeverity(
  infos: ReadonlyArray<{ severity: Severity }>,
): Severity {
  return infos.reduce(
    (highest, { severity }) => (severity > highest ? severity : highest),
    MIN_SEVERITY,
  );
}

export function lowestSeverity(
  infos: ReadonlyArray<{ severity: Severity }>,
): Severity {
  return infos.reduce(
    (lowest, { severity }) => (severity < lowest ? severity : lowest),
    99,
  );
}

export function listDiagnostics(
  group: Group,
  { includeAllSeverities = false } = {},
): Diagnostic[] {
  const rows: Diagnostic[] = [];
  const visible = (severity: Severity) =>
    includeAllSeverities || severity > MIN_SEVERITY;
  for (const loc of group.codeLocations) {
    const info = group.codes.get(loc);
    if (info != null && visible(info.severity))
      rows.push({ kind: 'code', info });
  }
  for (const loc of group.deoptLocations) {
    const info = group.deopts.get(loc);
    if (info != null && visible(info.severity))
      rows.push({ kind: 'deopt', info });
  }
  for (const loc of group.icLocations) {
    const info = group.ics.get(loc);
    if (info != null && visible(info.severity)) rows.push({ kind: 'ic', info });
  }
  rows.sort(
    (a, b) =>
      a.info.line - b.info.line ||
      a.info.column - b.info.column ||
      b.info.severity - a.info.severity,
  );
  return rows;
}

export function optimizationTier(stateName: string): number {
  switch (stateName) {
    case 'interpreted':
      return 0;
    case 'sparkplug':
      return 1;
    case 'maglev':
      return 2;
    case 'optimized':
      return 3;
    default:
      return -1;
  }
}

function analyzeCodeUpdates(updates: CodeUpdate[]) {
  let maxTier = -1;
  let prevTier = -1;
  let churned = false;
  let dropped = false;
  for (const { stateName } of updates) {
    const tier = optimizationTier(stateName);
    if (tier === -1) continue;
    if (tier > maxTier) maxTier = tier;
    else churned = true;
    if (prevTier !== -1 && tier < prevTier) dropped = true;
    prevTier = tier;
  }
  return { churned, dropped };
}

export function highestSeverityUpdate<T extends Update>(updates: T[]): T {
  return updates.reduce((highest, update) =>
    update.severity > highest.severity ? update : highest,
  );
}

// Produces a short human-readable phrase for a diagnostic, describing the most
// severe thing that happened to it so a summary row reads as e.g.
// "IC changed to megamorphic" rather than just naming the category.
export function describeDiagnostic({ kind, info }: Diagnostic): string {
  if (kind === 'ic') {
    return `IC changed to ${highestSeverityUpdate(info.updates).newStateName}`;
  }
  if (kind === 'deopt') {
    const { deoptReason, bailoutType } = highestSeverityUpdate(info.updates);
    return `deoptimized: ${deoptReason || bailoutType}`;
  }
  const updates = info.updates;
  return `ended as ${updates[updates.length - 1].stateName}`;
}

export function tipForDiagnostic({ kind, info }: Diagnostic): string | null {
  if (kind === 'code') {
    const { churned, dropped } = analyzeCodeUpdates(info.updates);
    if (dropped) {
      return 'V8 optimized this function to a higher tier but then discarded that optimized code and fell back to a lower tier (a deoptimization). This usually means the function received values whose types or object shapes changed after it was optimized. Keep the arguments and objects flowing through this function consistent so V8 can keep the optimized version.';
    }
    if (churned) {
      return 'V8 re-optimized this function repeatedly without settling on a single optimized version. This churn wastes compilation work and usually points to types or object shapes that keep changing between calls. Keep the values reaching this function consistent so V8 can optimize it once and keep that code.';
    }
  }
  if (kind === 'ic') {
    const { newState } = highestSeverityUpdate(info.updates);
    if (newState === ICState.MEGAMORPHIC || newState === ICState.GENERIC) {
      return 'This access saw too many different object shapes, so its inline cache went megamorphic and V8 can no longer optimize it. Keep the objects reaching this line consistent (the same properties added in the same order) so the access can stay monomorphic.';
    }
  }
  if (kind === 'deopt') {
    switch (highestSeverityUpdate(info.updates).deoptReason) {
      case 'not a Smi':
        return 'The optimized code expected a small integer (Smi) here but got something else, such as a floating-point number or an integer too large to fit, so it had to deoptimize. Keep this value a small integer where you can, and avoid mixing integers with doubles at this spot.';
      case 'not a Number':
        return 'The optimized code expected a number here but got a non-numeric value, such as a string, object, or undefined, so it had to deoptimize. Keep the type of this value consistent so V8 can rely on it being a number.';
      case 'wrong call target':
        return 'The function called here varied too much for V8 to keep the call site specialized, so it had to deoptimize. This happens when the callee changes, such as a method that resolves to different implementations or a reference that holds different functions over time. Keep this call site invoking the same function so V8 can rely on the target.';
      case 'wrong map':
        return 'The optimized code was specialized for objects of one shape here, but got an object with a different shape, so it had to deoptimize. Keep the objects reaching this line consistent (the same properties added in the same order) so V8 can rely on their shape.';
    }
  }
  return null;
}
