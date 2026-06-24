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
  #ics;
  #icLocations;
  #icLocationIdx;
  #deopts;
  #deoptLocations;
  #deoptLocationIdx;
  #codes;
  #codeLocations;
  #codeLocationIdx;
  #selectedLocation;

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
    this.#ics = ics;
    this.#ics = includeAllSeverities ? ics : highSeverity(ics);
    this.#icLocations = includeAllSeverities
      ? icLocations
      : includedIn(this.#ics, icLocations);
    this.#icLocationIdx = 0;

    this.#deopts = includeAllSeverities ? deopts : highSeverity(deopts);
    this.#deoptLocations = includeAllSeverities
      ? deoptLocations
      : includedIn(this.#deopts, deoptLocations);
    this.#deoptLocationIdx = 0;

    this.#codes = includeAllSeverities ? codes : highSeverity(codes);
    this.#codeLocations = includeAllSeverities
      ? codeLocations
      : includedIn(this.#codes, codeLocations);
    this.#codeLocationIdx = 0;

    this.#selectedLocation = selectedLocation;
  }

  // Resolves the markers anchored at the given code location into two lists of
  // Preact elements to render before and after the code at that location.
  resolve(codeLocation) {
    const insertBefore = [];
    const insertAfter = [];
    for (const { info, kind } of this.#collect(codeLocation)) {
      const marker = this.#markerSymbol(info, kind);
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
    const entries = this.#collect(codeLocation);
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
      selected: entries.some((e) => this.#selectedLocation === e.info.id),
      ids: entries.map((e) => e.info.id),
    };
  }

  nextLocation() {
    const nextIc = unkeyLocation(this.#icLocations[this.#icLocationIdx]);
    const nextDeopt = unkeyLocation(
      this.#deoptLocations[this.#deoptLocationIdx],
    );
    const nextOpt = unkeyLocation(this.#codeLocations[this.#codeLocationIdx]);
    return [nextDeopt, nextOpt].reduce((next, loc) => {
      if (next == null) return loc;
      if (loc == null) return next;
      if (next.line > loc.line) return loc;
      if (next.line < loc.line) return next;
      return next.column < loc.column ? next : loc;
    }, nextIc);
  }

  #collect(codeLocation) {
    return [
      ...this.#resolveDeopt(codeLocation),
      ...this.#resolveIc(codeLocation),
      ...this.#resolveCode(codeLocation),
    ];
  }

  #resolveDeopt(codeLocation) {
    if (this.#deopts == null) return [];
    const { entries, locationIdx } = this.#resolveEntries({
      codeLocation,
      map: this.#deopts,
      locationIdx: this.#deoptLocationIdx,
      locations: this.#deoptLocations,
    });
    this.#deoptLocationIdx = locationIdx;
    return entries;
  }

  #resolveIc(codeLocation) {
    if (this.#ics == null) return [];
    const { entries, locationIdx } = this.#resolveEntries({
      codeLocation,
      map: this.#ics,
      locationIdx: this.#icLocationIdx,
      locations: this.#icLocations,
    });
    this.#icLocationIdx = locationIdx;
    return entries;
  }

  #resolveCode(codeLocation) {
    if (this.#codes == null) return [];
    const { entries, locationIdx } = this.#resolveEntries({
      codeLocation,
      map: this.#codes,
      locationIdx: this.#codeLocationIdx,
      locations: this.#codeLocations,
    });
    this.#codeLocationIdx = locationIdx;
    return entries;
  }

  #resolveEntries({ map, codeLocation, locationIdx, locations }) {
    const entries = [];

    let locationKey = locations[locationIdx];
    let currentLocation = unkeyLocation(locationKey);

    while (
      currentLocation != null &&
      applyMark(codeLocation, currentLocation)
    ) {
      if (map.has(locationKey)) {
        entries.push({ info: map.get(locationKey), kind: this.#kindOf(map) });
      }
      locationIdx++;
      locationKey = locations[locationIdx];
      currentLocation = unkeyLocation(locationKey);
    }
    return { entries, locationIdx };
  }

  #kindOf(map) {
    return map === this.#deopts ? 'deopt' : map === this.#ics ? 'ic' : 'code';
  }

  #markerSymbol(info, kind) {
    const symbol =
      kind === 'deopt' ? DEOPTSYMBOL : kind === 'ic' ? ICSYMBOL : CODESYMBOL;
    const color = severityColors[info.severity - 1];
    const className =
      this.#selectedLocation === info.id ? `${color} selected` : color;
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
