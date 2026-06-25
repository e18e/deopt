import {
  highestSeverity,
  optimizationTier,
  MIN_SEVERITY,
} from '@e18e/deopt-shared';
import { nameOptimizationState } from '@e18e/deopt-processor';
const SEVERITY_2_FACTOR = 10;
const SEVERITY_3_FACTOR = 30;

function addLastCodeState(codeStates, updates) {
  const lastState = updates[updates.length - 1].state;
  codeStates[lastState]++;
}

export function summarizeFile({ ics, deopts, codes }) {
  const icSeverities = [0, 0, 0, 0];
  const deoptSeverities = [0, 0, 0, 0];
  const codeSeverities = [0, 0, 0, 0];
  const codeStates = [0, 0, 0];
  for (const icVector of ics.values()) {
    const severity = highestSeverity(icVector.updates);
    icVector.severity = severity;
    icSeverities[severity]++;
  }
  for (const deoptVector of deopts.values()) {
    const severity = highestSeverity(deoptVector.updates);
    deoptVector.severity = severity;
    deoptSeverities[severity]++;
  }
  for (const codeVector of codes.values()) {
    const { updates } = codeVector;
    // A regular warm-up is expected and not actionable, so it stays at MIN_SEVERITY.
    // Severity is raised when optimization tiers are dropped or churned.
    let maxTier = -1;
    let prevTier = -1;
    let churn = 0;
    let dropped = false;
    for (const { state } of updates) {
      const tier = optimizationTier(nameOptimizationState(state));
      if (tier === -1) continue;
      if (tier > maxTier) maxTier = tier;
      else churn++;
      if (prevTier !== -1 && tier < prevTier) dropped = true;
      prevTier = tier;
    }
    let severity = MIN_SEVERITY;
    if (dropped) severity = 3;
    else if (churn > 0) severity = churn > 2 ? 3 : 2;
    codeSeverities[severity]++;
    codeVector.severity = severity;
    addLastCodeState(codeStates, updates);
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
