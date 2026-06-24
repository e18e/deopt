/* global location */

function parseNum(s) {
  return s == null || s === '' ? null : parseInt(s)
}

function parseBool(s) {
  return s === 'true'
}

export function stateFromUrl() {
  if (location.search == null || location.search.length < 2) return null
  const params = new URLSearchParams(location.search)
  const state = {
      includeAllSeverities  : parseBool(params.get('includeAllSeverities'))
    , selectedFileIdx       : parseNum(params.get('selectedFileIdx'))
    , selectedLocation      : parseNum(params.get('selectedLocation'))
    , selectedTabIdx        : parseNum(params.get('selectedTabIdx'))
    , selectedSummaryTabIdx : parseNum(params.get('selectedSummaryTabIdx'))
  }
  return state
}

export function urlFromState(state) {
  const params = new URLSearchParams()
  for (const [ key, value ] of Object.entries(state)) {
    params.set(key, value == null ? '' : value)
  }
  return `${location.origin}${location.pathname}?${params}`
}
