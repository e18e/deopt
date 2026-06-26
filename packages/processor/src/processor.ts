import {
  LogReader,
  parseString,
  parseVarArgs,
} from './vendor/v8-tools/logreader.mjs';
import { Profile } from './vendor/v8-tools/profile.mjs';
import type { ProfileEntry } from './vendor/v8-tools/profile.mjs';

import { IcEntry } from './log-processing/ic-entry.js';
import { DeoptEntry } from './log-processing/deopt-entry.js';
import { CodeEntry } from './log-processing/code-entry.js';
import { parseOptimizationState } from './log-processing/optimization-state.js';
import type {
  ParsedIcInfo,
  ParsedDeoptInfo,
  ParsedCodeInfo,
} from '@e18e/deopt-shared';

export interface DeoptProcessorOptions {
  silentErrors?: boolean;
}

interface FunctionInfo {
  fnFile: string;
  line: number;
  column: number;
  state: number;
}

function maybeNumber(s: string): number {
  return parseInt(s);
}

function formatName(entry: ProfileEntry): {
  fnFile: string;
  line: number;
  column: number;
} {
  const name = entry.getRawName ? entry.getRawName() : entry.getName();
  const re = /(.*):([0-9]+):([0-9]+)$/;
  const array = re.exec(name);
  if (!array) return { fnFile: name, line: -1, column: -1 };
  return {
    fnFile: array[1],
    line: maybeNumber(array[2]),
    column: maybeNumber(array[3]),
  };
}

function locationKey(file: string, line: number, column: number): string {
  return `${file}:${line}:${column}`;
}

const propertyICParser = [
  parseInt,
  parseInt,
  parseInt,
  parseInt,
  parseString,
  parseString,
  parseInt,
  parseString,
  parseString,
  parseString,
];

export class DeoptProcessor extends LogReader {
  #root: string;
  #silentErrors: boolean;
  #deserializedEntriesNames: string[];
  #profile: Profile;

  entriesIC: Map<string, IcEntry>;
  entriesDeopt: Map<string, DeoptEntry>;
  entriesCode: Map<string, CodeEntry>;

  constructor(
    root: string,
    { silentErrors = true }: DeoptProcessorOptions = {},
  ) {
    super();
    this.#root = root;
    this.#silentErrors = silentErrors;

    // LogReader requires a null-prototype dispatch table
    this.setDispatchTable(
      Object.assign(Object.create(null), {
        // Collect info about CRUD of code
        'code-creation': {
          parsers: [
            parseString,
            parseInt,
            parseInt,
            parseInt,
            parseInt,
            parseString,
            parseVarArgs,
          ],
          processor: this.#processCodeCreation.bind(this),
        },
        'code-move': {
          parsers: [parseInt, parseInt],
          processor: this.#processCodeMove.bind(this),
        },
        'code-delete': {
          parsers: [parseInt],
          processor: this.#processCodeDelete.bind(this),
        },
        'sfi-move': {
          parsers: [parseInt, parseInt],
          processor: this.#processFunctionMove.bind(this),
        },

        // Collect deoptimization info
        'code-deopt': {
          parsers: [
            parseInt,
            parseInt,
            parseInt,
            parseInt,
            parseInt,
            parseString,
            parseString,
            parseString,
          ],
          processor: this.#processCodeDeopt.bind(this),
        },

        // Collect IC info
        LoadIC: {
          parsers: propertyICParser,
          processor: this.#processPropertyIC.bind(this, 'LoadIC'),
        },
        StoreIC: {
          parsers: propertyICParser,
          processor: this.#processPropertyIC.bind(this, 'StoreIC'),
        },
        KeyedLoadIC: {
          parsers: propertyICParser,
          processor: this.#processPropertyIC.bind(this, 'KeyedLoadIC'),
        },
        KeyedStoreIC: {
          parsers: propertyICParser,
          processor: this.#processPropertyIC.bind(this, 'KeyedStoreIC'),
        },
        StoreInArrayLiteralIC: {
          parsers: propertyICParser,
          processor: this.#processPropertyIC.bind(
            this,
            'StoreInArrayLiteralIC',
          ),
        },
      }),
    );

    this.#deserializedEntriesNames = [];
    this.#profile = new Profile();

    this.entriesIC = new Map();
    this.entriesDeopt = new Map();
    this.entriesCode = new Map();
  }

  functionInfo(pc: number): FunctionInfo {
    const entry = this.#profile.findEntry(pc);
    if (entry === null) return { fnFile: '', line: -1, column: -1, state: -1 };
    const { fnFile, line, column } = formatName(entry);
    return { fnFile, line, column, state: entry.state };
  }

  #processPropertyIC(
    type: string,
    pc: number,
    _timestamp: number,
    line: number,
    column: number,
    old_state: string,
    new_state: string,
    map: number,
    propertyKey: string,
    _modifier: string,
    _slow_reason: string,
  ): void {
    const { fnFile, state } = this.functionInfo(pc);
    const key = locationKey(fnFile, line, column);
    let icEntry = this.entriesIC.get(key);
    if (icEntry === undefined) {
      icEntry = new IcEntry(fnFile, line, column);
      this.entriesIC.set(key, icEntry);
    }
    icEntry.addUpdate(type, old_state, new_state, propertyKey, map, state);
  }

  // timestamp is in micro seconds
  // https://cs.chromium.org/chromium/src/v8/src/log.cc?l=892&rcl=8fecf0eff7357c1bee222f76c4e2f6fdd8759797
  #processCodeDeopt(
    timestamp: number,
    _size: number,
    code: number,
    inliningId: number,
    _scriptOffset: number,
    bailoutType: string,
    sourcePositionText: string,
    deoptReasonText: string,
  ): void {
    const { fnFile, state } = this.functionInfo(code);
    const { file, line, column } =
      DeoptEntry.disassembleSourcePosition(sourcePositionText);
    if (file === null) return;

    const key = locationKey(file, line, column);
    let deoptEntry = this.entriesDeopt.get(key);
    if (deoptEntry === undefined) {
      deoptEntry = new DeoptEntry(fnFile, file, line, column);
      this.entriesDeopt.set(key, deoptEntry);
    }
    deoptEntry.addUpdate(
      timestamp,
      bailoutType,
      deoptReasonText,
      state,
      inliningId,
    );
  }

  #processCodeCreation(
    type: string,
    _kind: number,
    timestamp: number,
    start: number,
    size: number,
    name: string,
    maybe_func: string[],
  ): void {
    name = this.#deserializedEntriesNames[start] || name;

    if (maybe_func.length) {
      const funcAddr = parseInt(maybe_func[0]);
      const state = parseOptimizationState(maybe_func[1]);
      this.#profile.addFuncCode(
        type,
        name,
        timestamp,
        start,
        size,
        funcAddr,
        state,
      );
      const isScript = type === 'Eval' || type === 'Script';
      const isUserFunction = type === 'JS' || type === 'LazyCompile';
      if (isUserFunction || isScript) {
        const { fnFile, line, column } = this.functionInfo(start);

        // only interested in Node.js anonymous wrapper function
        // (function (exports, require, module, __filename, __dirname) {
        const isNodeWrapperFunction = line === 1 && column === 1;
        if (isScript && !isNodeWrapperFunction) return;

        const key = locationKey(fnFile, line, column);
        let code = this.entriesCode.get(key);
        if (code === undefined) {
          code = new CodeEntry({ fnFile, line, column, isScript });
          this.entriesCode.set(key, code);
        }
        code.addUpdate(timestamp, state);
      }
    } else {
      this.#profile.addCode(type, name, timestamp, start, size);
    }
  }

  #processCodeMove(from: number, to: number): void {
    this.#profile.moveCode(from, to);
  }

  #processCodeDelete(start: number): void {
    this.#profile.deleteCode(start);
  }

  #processFunctionMove(from: number, to: number): void {
    this.#profile.moveSharedFunctionInfo(from, to);
  }

  override printError(msg: string): void {
    if (this.#silentErrors) return;
    console.trace();
    console.error(msg);
  }

  async processString(content: string): Promise<void> {
    const end = content.length;
    let current = 0;
    let next = 0;
    while (current < end) {
      next = content.indexOf('\n', current);
      if (next === -1) break;
      const line = content.substring(current, next);
      current = next + 1;
      await this.processLogLine(line);
    }
  }

  filterIcStateChanges(): void {
    const emptyEntries = new Set<string>();
    for (const [key, entry] of this.entriesIC) {
      entry.filterIcStateChanges();
      if (entry.updates.length === 0) emptyEntries.add(key);
    }
    for (const key of emptyEntries) this.entriesIC.delete(key);
  }

  toParsed(): {
    ics: ParsedIcInfo[];
    deopts: ParsedDeoptInfo[];
    codes: ParsedCodeInfo[];
    root: string;
  } {
    const ics: ParsedIcInfo[] = [];
    for (const entry of this.entriesIC.values()) {
      ics.push(entry.toParsed());
    }
    const deopts: ParsedDeoptInfo[] = [];
    for (const entry of this.entriesDeopt.values()) {
      deopts.push(entry.toParsed());
    }
    const codes: ParsedCodeInfo[] = [];
    for (const entry of this.entriesCode.values()) {
      codes.push(entry.toParsed());
    }
    return { ics, deopts, codes, root: this.#root };
  }

  toJSON(indent: number = 2): string {
    return JSON.stringify(this.toParsed(), null, indent);
  }
}
