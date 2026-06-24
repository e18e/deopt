import { severityColors, MIN_SEVERITY } from '../../../lib/severities.js'
import { unkeyLocation } from '../../../lib/grouping/location.js'

const DEOPTSYMBOL = '▼'
const ICSYMBOL = '☎'
const CODESYMBOL = '▲'

function applyMark(codeLocation, markerLocation) {
  if (codeLocation.line > markerLocation.line) return true
  if (codeLocation.line < markerLocation.line) return false
  if (codeLocation.column < markerLocation.column) return false
  return true
}

function highSeverity(map) {
  const res = new Map()
  for (const [ key, info ] of map) {
    if (info.severity === MIN_SEVERITY) continue
    res.set(key, info)
  }
  return res
}

function includedIn(map, arr) {
  return arr.filter(x => map.has(x))
}

export class MarkerResolver {
  constructor({
      ics
    , deopts
    , codes
    , icLocations
    , deoptLocations
    , codeLocations
    , selectedLocation = null
    , includeAllSeverities = true
  }) {
    this._ics = ics
    this._ics = includeAllSeverities ? ics : highSeverity(ics)
    this._icLocations = includeAllSeverities ? icLocations : includedIn(this._ics, icLocations)
    this._icLocationIdx = 0

    this._deopts = includeAllSeverities ? deopts : highSeverity(deopts)
    this._deoptLocations = includeAllSeverities ? deoptLocations : includedIn(this._deopts, deoptLocations)
    this._deoptLocationIdx = 0

    this._codes = includeAllSeverities ? codes : highSeverity(codes)
    this._codeLocations = includeAllSeverities ? codeLocations : includedIn(this._codes, codeLocations)
    this._codeLocationIdx = 0

    this._selectedLocation = selectedLocation
  }

  // Resolves the markers anchored at the given code location into two lists of
  // Preact elements to render before and after the code at that location.
  resolve(codeLocation) {
    const insertBefore = []
    const insertAfter = []
    for (const { before, after } of [
        this._resolveDeopt(codeLocation)
      , this._resolveIc(codeLocation)
      , this._resolveCode(codeLocation)
    ]) {
      insertBefore.push(...before)
      insertAfter.push(...after)
    }
    return { insertBefore, insertAfter }
  }

  nextLocation() {
    const nextIc = unkeyLocation(this._icLocations[this._icLocationIdx])
    const nextDeopt = unkeyLocation(this._deoptLocations[this._deoptLocationIdx])
    const nextOpt = unkeyLocation(this._codeLocations[this._codeLocationIdx])
    return [ nextDeopt, nextOpt ].reduce((next, loc) => {
      if (next == null) return loc
      if (loc == null) return next
      if (next.line > loc.line) return loc
      if (next.line < loc.line) return next
      return next.column < loc.column ? next : loc
    }, nextIc)
  }

  _resolveDeopt(codeLocation) {
    if (this._deopts == null) return { before: [], after: [] }
    const { before, after, locationIdx } = this._resolve({
        codeLocation
      , map         : this._deopts
      , locationIdx : this._deoptLocationIdx
      , locations   : this._deoptLocations
    })
    this._deoptLocationIdx = locationIdx
    return { before, after }
  }

  _resolveIc(codeLocation) {
    if (this._ics == null) return { before: [], after: [] }
    const { before, after, locationIdx } = this._resolve({
        codeLocation
      , map         : this._ics
      , locationIdx : this._icLocationIdx
      , locations   : this._icLocations
    })
    this._icLocationIdx = locationIdx
    return { before, after }
  }

  _resolveCode(loc) {
    if (this._codes == null) return { before: [], after: [] }
    const { before, after, locationIdx } = this._resolve({
        codeLocation: loc
      , map         : this._codes
      , locationIdx : this._codeLocationIdx
      , locations   : this._codeLocations
    })
    this._codeLocationIdx = locationIdx
    return { before, after }
  }

  _resolve({ map, codeLocation, locationIdx, locations }) {
    const before = []
    const after = []

    let locationKey = locations[locationIdx]
    let currentLocation = unkeyLocation(locationKey)

    while (
      currentLocation != null &&
      applyMark(codeLocation, currentLocation)
    ) {
      const { marker, placeBefore } = this._determineMarker(map, locationKey)
      if (marker != null) {
        if (placeBefore) before.push(marker)
        else after.push(marker)
      }
      locationIdx++
      locationKey = locations[locationIdx]
      currentLocation = unkeyLocation(locationKey)
    }
    return { before, after, locationIdx }
  }

  _determineMarker(map, key) {
    const kind = (
        map === this._deopts ?  'deopt'
      : map === this._ics ? 'ic'
      : 'code'
    )
    if (map != null && map.has(key)) {
      return this._handle(map.get(key), kind)
    }
    return { marker: null, placeBefore: false }
  }

  _handle(info, kind) {
    const marker = this._markerSymbol(info, kind)

    // anonymous Node.js function wrapper
    const placeBefore = (info.isScript && info.line === 1 && info.column === 1)
    return { marker, placeBefore }
  }

  _markerSymbol(info, kind) {
    const symbol = (
        kind === 'deopt' ? DEOPTSYMBOL
      : kind === 'ic' ? ICSYMBOL
      : CODESYMBOL
    )
    const color = severityColors[info.severity - 1]
    const className = (
      this._selectedLocation === info.id
      ? `${color} selected`
      : color
    )
    return (
      <a
        key={`${kind}-${info.id}`}
        href='#'
        id={`code-location-${info.id}`}
        class={className}
        data-markerid={info.id}
        data-markertype={kind}>{symbol}</a>
    )
  }
}
