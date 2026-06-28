import type {
  ProcessedCodeUpdate,
  FileSummary,
  Group,
} from '@e18e/deopt-shared';

const SEVERITY_2_FACTOR = 10;
const SEVERITY_3_FACTOR = 30;

function addLastCodeState(
  codeStates: number[],
  updates: ProcessedCodeUpdate[],
): void {
  const lastState = updates[updates.length - 1].state;
  codeStates[lastState]++;
}

export function summarizeFile({
  ics,
  deopts,
  codes,
}: Pick<Group, 'ics' | 'deopts' | 'codes'>): FileSummary {
  const icSeverities = [0, 0, 0, 0];
  const deoptSeverities = [0, 0, 0, 0];
  const codeSeverities = [0, 0, 0, 0];
  const codeStates = [0, 0, 0];
  for (const icVector of ics.values()) {
    icSeverities[icVector.severity]++;
  }
  for (const deoptVector of deopts.values()) {
    deoptSeverities[deoptVector.severity]++;
  }
  for (const codeVector of codes.values()) {
    codeSeverities[codeVector.severity]++;
    addLastCodeState(codeStates, codeVector.updates);
  }

  const severityScore =
    icSeverities[1] +
    icSeverities[2] * SEVERITY_2_FACTOR +
    icSeverities[3] * SEVERITY_3_FACTOR +
    deoptSeverities[1] +
    deoptSeverities[2] * SEVERITY_2_FACTOR +
    deoptSeverities[3] * SEVERITY_3_FACTOR +
    codeSeverities[1] +
    codeSeverities[2] * SEVERITY_2_FACTOR +
    codeSeverities[3] * SEVERITY_3_FACTOR;
  const hasCriticalSeverities =
    icSeverities[2] > 0 ||
    icSeverities[3] > 0 ||
    deoptSeverities[2] > 0 ||
    deoptSeverities[3] > 0 ||
    codeSeverities[2] > 0 ||
    codeSeverities[3] > 0;
  return {
    icSeverities,
    deoptSeverities,
    codeSeverities,
    codeStates,
    severityScore,
    hasCriticalSeverities,
  };
}
