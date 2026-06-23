import { MIN_SEVERITY } from '../severities.js'

const NO_FEEDBACK = 0
const UNINITIALIZED = 1
const PREMONOMORPHIC = 2
const MONOMORPHIC = 3
const RECOMPUTE_HANDLER = 4
const POLYMORPHIC = 5
const MEGAMORPHIC = 6
const GENERIC = 7

export function parseIcState(s) {
  switch (s) {
    case 'X': return NO_FEEDBACK
    case '0': return UNINITIALIZED
    case '.': return PREMONOMORPHIC
    case '1': return MONOMORPHIC
    case '^': return RECOMPUTE_HANDLER
    case 'P': return POLYMORPHIC
    case 'N': return MEGAMORPHIC
    case 'G': return GENERIC
    default: throw new Error('parse: unknown ic code state: ' + s)
  }
}

export function nameIcState(state) {
  switch (state) {
    case NO_FEEDBACK       : return 'no feedback'
    case UNINITIALIZED     : return 'unintialized'
    case PREMONOMORPHIC    : return 'premonomorphic'
    case MONOMORPHIC       : return 'monomorphic'
    case RECOMPUTE_HANDLER : return 'recompute handler'
    case POLYMORPHIC       : return 'polymorphic'
    case MEGAMORPHIC       : return 'megamorphic'
    case GENERIC           : return 'generic'
    default: throw new Error('name: unknown ic code state : ' + state)
  }
}

export function severityIcState(state) {
  switch (state) {
    case NO_FEEDBACK       : return MIN_SEVERITY
    case UNINITIALIZED     : return MIN_SEVERITY
    case PREMONOMORPHIC    : return MIN_SEVERITY
    case MONOMORPHIC       : return MIN_SEVERITY
    case RECOMPUTE_HANDLER : return MIN_SEVERITY
    case POLYMORPHIC       : return MIN_SEVERITY + 1
    case MEGAMORPHIC       : return MIN_SEVERITY + 2
    case GENERIC           : return MIN_SEVERITY + 2
    default: throw new Error('severity: unknown ic code state : ' + state)
  }
}
