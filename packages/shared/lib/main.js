export * as ICState from './ic-state.js';

export const MIN_SEVERITY = 1;

export const severityColors = ['green', 'blue', 'dark-red'];

export function highestSeverity(infos) {
  return infos.reduce(
    (highest, { severity }) => (severity > highest ? severity : highest),
    MIN_SEVERITY,
  );
}

export function lowestSeverity(infos) {
  return infos.reduce(
    (lowest, { severity }) => (severity < lowest ? severity : lowest),
    99,
  );
}

export function listDiagnostics(group, { includeAllSeverities = false } = {}) {
  if (group == null) return [];
  const rows = [];
  const collect = (data, locations, kind) => {
    if (data == null || locations == null) return;
    for (const loc of locations) {
      const info = data.get(loc);
      if (!includeAllSeverities && info.severity <= MIN_SEVERITY) continue;
      rows.push({ kind, info });
    }
  };
  collect(group.codes, group.codeLocations, 'code');
  collect(group.deopts, group.deoptLocations, 'deopt');
  collect(group.ics, group.icLocations, 'ic');
  rows.sort(
    (a, b) =>
      a.info.line - b.info.line ||
      a.info.column - b.info.column ||
      b.info.severity - a.info.severity,
  );
  return rows;
}

export function highestSeverityUpdate(updates) {
  return updates.reduce((highest, update) =>
    update.severity > highest.severity ? update : highest,
  );
}

// Produces a short human-readable phrase for a diagnostic, describing the most
// severe thing that happened to it so a summary row reads as e.g.
// "IC changed to megamorphic" rather than just naming the category.
export function describeDiagnostic({ kind, info }) {
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
