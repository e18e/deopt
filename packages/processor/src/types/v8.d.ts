declare module '*/vendor/v8-tools/logreader.mjs' {
  export type LogParser = (...args: any[]) => unknown;
  export interface DispatchEntry {
    parsers: LogParser[];
    processor: (...args: any[]) => void;
  }
  export type DispatchTable = Record<string, DispatchEntry>;
  export class LogReader {
    setDispatchTable(table: DispatchTable): void;
    processLogLine(line: string): Promise<void>;
    printError(msg: string): void;
  }
  export const parseString: LogParser;
  export const parseVarArgs: LogParser;
}

declare module '*/vendor/v8-tools/profile.mjs' {
  export interface ProfileEntry {
    state: number;
    getName(): string;
    getRawName?(): string;
  }
  export interface CodeStateMap {
    COMPILED: number;
    IGNITION: number;
    SPARKPLUG: number;
    MAGLEV: number;
    TURBOFAN: number;
  }
  export class Profile {
    static CodeState: CodeStateMap;
    static parseState(s: string): number;
    findEntry(pc: number): ProfileEntry | null;
    addFuncCode(
      type: string,
      name: string,
      timestamp: number,
      start: number,
      size: number,
      funcAddr: number,
      state: number,
    ): void;
    addCode(
      type: string,
      name: string,
      timestamp: number,
      start: number,
      size: number,
    ): void;
    moveCode(from: number, to: number): void;
    deleteCode(start: number): void;
    moveSharedFunctionInfo(from: number, to: number): void;
  }
}
