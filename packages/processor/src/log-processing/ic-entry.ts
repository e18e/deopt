import { parseIcState, severityIcState } from './ic-state.js';
import { normalizeFile } from './normalize-file.js';
import type { Severity } from '@e18e/deopt-shared';

export interface IcStateUpdate {
  type: string;
  oldState: number;
  newState: number;
  key: string;
  map: string;
  optimizationState: number;
  severity: Severity;
}

function unquote(s: string): string {
  // for some reason Node.js double quotes the file names
  return s.replace(/^"/, '').replace(/"$/, '');
}

export class IcEntry {
  functionName: string;
  file: string;
  line: number;
  column: number;
  updates: IcStateUpdate[];

  constructor(fnFile: string, line: number, column: number) {
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

  addUpdate(
    type: string,
    oldState: string,
    newState: string,
    key: string,
    map: number,
    optimizationState: number,
  ): void {
    const parsedOldState = parseIcState(oldState);
    const parsedNewState = parseIcState(newState);
    const severity = severityIcState(parsedNewState);

    this.updates.push({
      type,
      oldState: parsedOldState,
      newState: parsedNewState,
      key,
      map: map.toString(16),
      optimizationState,
      severity,
    });
  }

  filterIcStateChanges(): void {
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
