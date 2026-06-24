import { Profile } from '../vendor/v8-tools/profile.mjs'

const { CodeState } = Profile

export function parseOptimizationState(s) {
  return Profile.parseState(s)
}

export function nameOptimizationState(state) {
  switch (state) {
    case CodeState.COMPILED: return 'compiled'
    case CodeState.IGNITION: return 'interpreted'
    case CodeState.SPARKPLUG: return 'sparkplug'
    case CodeState.MAGLEV: return 'maglev'
    case CodeState.TURBOFAN: return 'optimized'
    case -1: return 'unknown'
    default: throw new Error('unknown code state: ' + state)
  }
}

export function severityOfOptimizationState(state) {
  switch (state) {
    case CodeState.COMPILED: return 3
    case CodeState.IGNITION: return 2
    case CodeState.SPARKPLUG: return 2
    case CodeState.MAGLEV: return 1
    case CodeState.TURBOFAN: return 1
    case -1: return 3
    default: throw new Error('unknown code state: ' + state)
  }
}
