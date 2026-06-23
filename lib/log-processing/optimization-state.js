import { Profile } from 'v8-tools-core/profile.js'

export const SPARKPLUG = 3
export const MAGLEV = 4

export function parseOptimizationState(s) {
  // V8 may suffix a tier marker with "'" for context-specialized code (e.g. "+'", "*'")
  switch (s.replace(/'$/, '')) {
    case '': return Profile.CodeState.COMPILED
    case '~': return Profile.CodeState.OPTIMIZABLE
    case '^': return SPARKPLUG
    case '*': return Profile.CodeState.OPTIMIZED
    case '+': return MAGLEV
    default: throw new Error('unknown code state: ' + s)
  }
}

export function nameOptimizationState(state) {
  switch (state) {
    case Profile.CodeState.COMPILED: return 'compiled'
    case Profile.CodeState.OPTIMIZABLE: return 'optimizable'
    case SPARKPLUG: return 'sparkplug'
    case Profile.CodeState.OPTIMIZED: return 'optimized'
    case MAGLEV: return 'maglev'
    case -1: return 'unknown'
    default: throw new Error('unknown code state: ' + state)
  }
}

export function severityOfOptimizationState(state) {
  switch (state) {
    case Profile.CodeState.COMPILED: return 3
    case Profile.CodeState.OPTIMIZABLE: return 2
    case SPARKPLUG: return 2
    case Profile.CodeState.OPTIMIZED: return 1
    case MAGLEV: return 1
    case -1: return 3
    default: throw new Error('unknown code state: ' + state)
  }
}
