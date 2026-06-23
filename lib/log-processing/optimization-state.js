import { Profile } from 'v8-tools-core/profile.js'

export function parseOptimizationState(s) {
  switch (s) {
    case '': return Profile.CodeState.COMPILED
    case '~': return Profile.CodeState.OPTIMIZABLE
    case '*': return Profile.CodeState.OPTIMIZED
    default: throw new Error('unknown code state: ' + s)
  }
}

export function nameOptimizationState(state) {
  switch (state) {
    case Profile.CodeState.COMPILED: return 'compiled'
    case Profile.CodeState.OPTIMIZABLE: return 'optimizable'
    case Profile.CodeState.OPTIMIZED: return 'optimized'
    case -1: return 'unknown'
    default: throw new Error('unknown code state: ' + state)
  }
}

export function severityOfOptimizationState(state) {
  switch (state) {
    case Profile.CodeState.COMPILED: return 3
    case Profile.CodeState.OPTIMIZABLE: return 2
    case Profile.CodeState.OPTIMIZED: return 1
    case -1: return 3
    default: throw new Error('unknown code state: ' + state)
  }
}
