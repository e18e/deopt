import { keyLocation, byLocationKey } from './location.js';
import { nameIcState } from '../ic-state.js';
import { severityIcState, nameOptimizationState } from '@e18e/deopt-processor';
import {
  highestSeverity,
  optimizationTier,
  MIN_SEVERITY,
} from '@e18e/deopt-shared';
import type {
  Severity,
  Location,
  ParsedIcInfo,
  ParsedDeoptInfo,
  ParsedCodeInfo,
  ParsedIcUpdate,
  ParsedCodeUpdate,
  ProcessedIcInfo,
  ProcessedDeoptInfo,
  ProcessedCodeInfo,
  ProcessedIcUpdate,
  ProcessedCodeUpdate,
} from '@e18e/deopt-shared';
import type { FileGroup, RenderGroup } from '../types.js';

interface ProcessedVectors<T> {
  byLocation: Map<string, T>;
  locations: string[];
}

function processIcUpdate(update: ParsedIcUpdate): ProcessedIcUpdate {
  return {
    ...update,
    oldStateName: nameIcState(update.oldState),
    oldStateSeverity: severityIcState(update.oldState),
    newStateName: nameIcState(update.newState),
    newStateSeverity: severityIcState(update.newState),
  };
}

function processCodeUpdate(update: ParsedCodeUpdate): ProcessedCodeUpdate {
  return { ...update, stateName: nameOptimizationState(update.state) };
}

// A regular warm-up is expected and not actionable, so it stays at MIN_SEVERITY.
// Severity is raised when optimization tiers are dropped or churned.
function codeSeverity(updates: ParsedCodeUpdate[]): Severity {
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
  if (dropped) return 3;
  if (churn > 0) return churn > 2 ? 3 : 2;
  return MIN_SEVERITY;
}

function processIcInfo(parsed: ParsedIcInfo, id: number): ProcessedIcInfo {
  const updates = parsed.updates.map(processIcUpdate);
  return { ...parsed, id, severity: highestSeverity(updates), updates };
}

function processDeoptInfo(
  parsed: ParsedDeoptInfo,
  id: number,
): ProcessedDeoptInfo {
  return { ...parsed, id, severity: highestSeverity(parsed.updates) };
}

function processCodeInfo(
  parsed: ParsedCodeInfo,
  id: number,
): ProcessedCodeInfo {
  const updates = parsed.updates.map(processCodeUpdate);
  return { ...parsed, id, severity: codeSeverity(parsed.updates), updates };
}

function processVectors<P extends Location, T>(
  parsed: P[],
  process: (vector: P, id: number) => T,
  nextId: () => number,
): ProcessedVectors<T> {
  const byLocation = new Map<string, T>();
  const locations = new Set<string>();
  for (const vector of parsed) {
    const key = keyLocation(vector);
    locations.add(key);
    byLocation.set(key, process(vector, nextId()));
  }
  return { byLocation, locations: Array.from(locations).sort(byLocationKey) };
}

export function groupByFileAndLocation(
  groupedByFile: Map<string, FileGroup>,
): Map<string, RenderGroup> {
  const result = new Map<string, RenderGroup>();
  for (const [file, fileGroup] of groupedByFile) {
    let id = 0;
    const nextId = (): number => id++;
    const ics = processVectors(fileGroup.ics, processIcInfo, nextId);
    const deopts = processVectors(fileGroup.deopts, processDeoptInfo, nextId);
    const codes = processVectors(fileGroup.codes, processCodeInfo, nextId);

    result.set(file, {
      fullPath: fileGroup.fullPath,
      relativePath: fileGroup.relativePath,
      src: fileGroup.src,
      ics: ics.byLocation,
      deopts: deopts.byLocation,
      codes: codes.byLocation,
      icLocations: ics.locations,
      deoptLocations: deopts.locations,
      codeLocations: codes.locations,
    });
  }

  return result;
}
