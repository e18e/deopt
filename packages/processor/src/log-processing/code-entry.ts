import { severityOfOptimizationState } from './optimization-state.js';
import { normalizeFile } from './normalize-file.js';
import type { Severity } from '@e18e/deopt-shared';

export interface CodeStateUpdate {
  timestamp: number;
  state: number;
  severity: Severity;
}

export class CodeEntry {
  #functionName: string;
  #file: string;
  #line: number;
  #column: number;
  #isScript: boolean;
  updates: CodeStateUpdate[];

  constructor({
    fnFile,
    line,
    column,
    isScript,
  }: {
    fnFile: string;
    line: number;
    column: number;
    isScript: boolean;
  }) {
    const parts = fnFile.split(' ');
    this.#functionName = parts[0];
    this.#file = normalizeFile(parts[1]);
    this.#line = line;
    this.#column = column;
    this.#isScript = isScript;

    this.updates = [];
  }

  addUpdate(timestamp: number, state: number): void {
    const severity = severityOfOptimizationState(state);
    this.updates.push({ timestamp, state, severity });
  }

  get hashmap() {
    return {
      functionName: this.#functionName,
      file: this.#file,
      line: this.#line,
      column: this.#column,
      isScript: this.#isScript,
      updates: this.updates,
    };
  }
}
