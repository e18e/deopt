import { severityOfOptimizationState } from './optimization-state.js';
import { normalizeFile } from './normalize-file.js';

export class CodeEntry {
  #functionName;
  #file;
  #line;
  #column;
  #isScript;

  constructor({ fnFile, line, column, isScript }) {
    const parts = fnFile.split(' ');
    this.#functionName = parts[0];
    this.#file = normalizeFile(parts[1]);
    this.#line = line;
    this.#column = column;
    this.#isScript = isScript;

    this.updates = [];
  }

  addUpdate(timestamp, state) {
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
