import { Profile } from '../vendor/v8-tools/profile.mjs';
import type { Severity } from '@e18e/deopt-shared';

const { CodeState } = Profile;

export type OptimizationStateName =
  | 'compiled'
  | 'interpreted'
  | 'sparkplug'
  | 'maglev'
  | 'optimized'
  | 'unknown';

export function parseOptimizationState(s: string): number {
  return Profile.parseState(s);
}

export function nameOptimizationState(state: number): OptimizationStateName {
  switch (state) {
    case CodeState.COMPILED:
      return 'compiled';
    case CodeState.IGNITION:
      return 'interpreted';
    case CodeState.SPARKPLUG:
      return 'sparkplug';
    case CodeState.MAGLEV:
      return 'maglev';
    case CodeState.TURBOFAN:
      return 'optimized';
    case -1:
      return 'unknown';
    default:
      throw new Error('unknown code state: ' + state);
  }
}

export function severityOfOptimizationState(state: number): Severity {
  switch (state) {
    case CodeState.COMPILED:
      return 3;
    case CodeState.IGNITION:
      return 2;
    case CodeState.SPARKPLUG:
      return 2;
    case CodeState.MAGLEV:
      return 1;
    case CodeState.TURBOFAN:
      return 1;
    case -1:
      return 3;
    default:
      throw new Error('unknown code state: ' + state);
  }
}
