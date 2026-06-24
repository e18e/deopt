import { severityColors, MIN_SEVERITY } from '@e18e/deopt-shared';

function unkeyLocation(key) {
  if (key == null) return null;
  const [functionName, line, column] = key.split(':');
  return { functionName, line: parseInt(line), column: parseInt(column) };
}

const DEOPTSYMBOL = '▼';
const ICSYMBOL = '☎';
const CODESYMBOL = '▲';

function applyMark(codeLocation, markerLocation) {
  if (codeLocation.line > markerLocation.line) return true;
  if (codeLocation.line < markerLocation.line) return false;
  if (codeLocation.column < markerLocation.column) return false;
  return true;
}

function highSeverity(map) {
  const res = new Map();
  for (const [key, info] of map) {
    if (info.severity === MIN_SEVERITY) continue;
    res.set(key, info);
  }
  return res;
}

function includedIn(map, arr) {
  return arr.filter((x) => map.has(x));
}

export class MarkerResolver {
  constructor({
    ics,
    deopts,
    codes,
    icLocations,
    deoptLocations,
    codeLocations,
    selectedLocation = null,
    includeAllSeverities = true,
  }) {
    this._ics = ics;
    this._ics = includeAllSeverities ? ics : highSeverity(ics);
    this._icLocations = includeAllSeverities
      ? icLocations
      : includedIn(this._ics, icLocations);
    this._icLocationIdx = 0;

    this._deopts = includeAllSeverities ? deopts : highSeverity(deopts);
    this._deoptLocations = includeAllSeverities
      ? deoptLocations
      : includedIn(this._deopts, deoptLocations);
    this._deoptLocationIdx = 0;

    this._codes = includeAllSeverities ? codes : highSeverity(codes);
    this._codeLocations = includeAllSeverities
      ? codeLocations
      : includedIn(this._codes, codeLocations);
    this._codeLocationIdx = 0;

    this._selectedLocation = selectedLocation;
  }

  // Resolves the markers anchored at the given code location into two lists of
  // Preact elements to render before and after the code at that location.
  resolve(codeLocation) {
    const insertBefore = [];
    const insertAfter = [];
    for (const { info, kind } of this._collect(codeLocation)) {
      const marker = this._markerSymbol(info, kind);
      // anonymous Node.js function wrapper
      if (info.isScript && info.line === 1 && info.column === 1) {
        insertBefore.push(marker);
      } else {
        insertAfter.push(marker);
      }
    }
    return { insertBefore, insertAfter };
  }

  // Resolves the markers anchored at the given code location into a single
  // descriptor for the highest-severity marker, used to underline the code
  // range rather than insert a symbol. Returns null when nothing is anchored.
  resolveMarker(codeLocation) {
    const entries = this._collect(codeLocation);
    if (entries.length === 0) return null;
    let best = entries[0];
    for (const entry of entries) {
      if (entry.info.severity > best.info.severity) best = entry;
    }
    const { info, kind } = best;
    return {
      id: info.id,
      kind,
      column: info.column,
      severity: info.severity,
      selected: entries.some((e) => this._selectedLocation === e.info.id),
      ids: entries.map((e) => e.info.id),
    };
  }

  nextLocation() {
    const nextIc = unkeyLocation(this._icLocations[this._icLocationIdx]);
    const nextDeopt = unkeyLocation(
      this._deoptLocations[this._deoptLocationIdx],
    );
    const nextOpt = unkeyLocation(this._codeLocations[this._codeLocationIdx]);
    return [nextDeopt, nextOpt].reduce((next, loc) => {
      if (next == null) return loc;
      if (loc == null) return next;
      if (next.line > loc.line) return loc;
      if (next.line < loc.line) return next;
      return next.column < loc.column ? next : loc;
    }, nextIc);
  }

  _collect(codeLocation) {
    return [
      ...this._resolveDeopt(codeLocation),
      ...this._resolveIc(codeLocation),
      ...this._resolveCode(codeLocation),
    ];
  }

  _resolveDeopt(codeLocation) {
    if (this._deopts == null) return [];
    const { entries, locationIdx } = this._resolveEntries({
      codeLocation,
      map: this._deopts,
      locationIdx: this._deoptLocationIdx,
      locations: this._deoptLocations,
    });
    this._deoptLocationIdx = locationIdx;
    return entries;
  }

  _resolveIc(codeLocation) {
    if (this._ics == null) return [];
    const { entries, locationIdx } = this._resolveEntries({
      codeLocation,
      map: this._ics,
      locationIdx: this._icLocationIdx,
      locations: this._icLocations,
    });
    this._icLocationIdx = locationIdx;
    return entries;
  }

  _resolveCode(codeLocation) {
    if (this._codes == null) return [];
    const { entries, locationIdx } = this._resolveEntries({
      codeLocation,
      map: this._codes,
      locationIdx: this._codeLocationIdx,
      locations: this._codeLocations,
    });
    this._codeLocationIdx = locationIdx;
    return entries;
  }

  _resolveEntries({ map, codeLocation, locationIdx, locations }) {
    const entries = [];

    let locationKey = locations[locationIdx];
    let currentLocation = unkeyLocation(locationKey);

    while (
      currentLocation != null &&
      applyMark(codeLocation, currentLocation)
    ) {
      if (map.has(locationKey)) {
        entries.push({ info: map.get(locationKey), kind: this._kindOf(map) });
      }
      locationIdx++;
      locationKey = locations[locationIdx];
      currentLocation = unkeyLocation(locationKey);
    }
    return { entries, locationIdx };
  }

  _kindOf(map) {
    return map === this._deopts ? 'deopt' : map === this._ics ? 'ic' : 'code';
  }

  _markerSymbol(info, kind) {
    const symbol =
      kind === 'deopt' ? DEOPTSYMBOL : kind === 'ic' ? ICSYMBOL : CODESYMBOL;
    const color = severityColors[info.severity - 1];
    const className =
      this._selectedLocation === info.id ? `${color} selected` : color;
    return (
      <a
        key={`${kind}-${info.id}`}
        href="#"
        class={className}
        data-markerid={info.id}
        data-markertype={kind}
        data-code-locations={info.id}
      >
        {symbol}
      </a>
    );
  }
}
