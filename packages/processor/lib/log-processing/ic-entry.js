import { parseIcState, severityIcState } from './ic-state.js';
import { normalizeFile } from './normalize-file.js';

function unquote(s) {
  // for some reason Node.js double quotes the file names
  return s.replace(/^"/, '').replace(/"$/, '');
}

export class IcEntry {
  constructor(fnFile, line, column) {
    fnFile = unquote(fnFile);
    const parts = fnFile.split(' ');
    const functionName = parts[0];
    const file = normalizeFile(parts[1]);

    this.functionName = functionName;
    this.file = file;
    this.line = line;
    this.column = column;
    this.updates = [];
  }

  addUpdate(type, oldState, newState, key, map, optimizationState) {
    map = map.toString(16);
    oldState = parseIcState(oldState);
    newState = parseIcState(newState);
    const severity = severityIcState(newState);

    this.updates.push({
      type,
      oldState,
      newState,
      key,
      map,
      optimizationState,
      severity,
    });
  }

  filterIcStateChanges() {
    this.updates = this.updates.filter((x) => x.oldState !== x.newState);
  }

  get hashmap() {
    return {
      functionName: this.functionName,
      file: this.file,
      line: this.line,
      column: this.column,
      updates: this.updates,
    };
  }
}
