import { groupByFileAndLocation } from './grouping/group-by-file-and-location.js'
import { summarizeFile } from './grouping/summarize-file.js'
import { severityIcState, nameOptimizationState } from '@e18e/deopt-processor'
import { nameIcState } from './ic-state.js'

function enrichIcUpdates(ics) {
  for (const vector of ics.values()) {
    for (const update of vector.updates) {
      update.oldStateName = nameIcState(update.oldState)
      update.oldStateSeverity = severityIcState(update.oldState)
      update.newStateName = nameIcState(update.newState)
      update.newStateSeverity = severityIcState(update.newState)
    }
  }
}

function enrichCodeUpdates(codes) {
  for (const vector of codes.values()) {
    for (const update of vector.updates) {
      update.stateName = nameOptimizationState(update.state)
    }
  }
}

// Produces the fully enriched render data so the client can stay a thin
// presentation layer: locations are grouped, ids and severities are assigned,
// per-file summaries are precomputed and every IC/optimization state is resolved
// to its display name. Returns a Map keyed by file, with ics/deopts/codes as
// per-location Maps.
export function buildRenderData(groupedByFile) {
  const groups = groupByFileAndLocation(groupedByFile)
  for (const group of groups.values()) {
    // summarizeFile assigns `severity` to every ic/deopt/code vector
    group.summary = summarizeFile({
        ics: group.ics
      , deopts: group.deopts
      , codes: group.codes
    })
    enrichIcUpdates(group.ics)
    enrichCodeUpdates(group.codes)
  }
  return groups
}

// Converts the enriched Map into a JSON-serializable structure, turning the
// per-location Maps into entry arrays that the client revives into Maps.
export function serializeRenderData(groups) {
  return Array.from(groups, ([ file, group ]) => [ file, {
      ...group
    , ics: Array.from(group.ics)
    , deopts: Array.from(group.deopts)
    , codes: Array.from(group.codes)
  } ])
}
