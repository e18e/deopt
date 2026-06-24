import { MIN_SEVERITY, ICState } from '@e18e/deopt-shared';

export function parseIcState(s) {
  switch (s) {
    case 'X':
      return ICState.NO_FEEDBACK;
    case '0':
      return ICState.UNINITIALIZED;
    case '.':
      return ICState.PREMONOMORPHIC;
    case '1':
      return ICState.MONOMORPHIC;
    case '^':
      return ICState.RECOMPUTE_HANDLER;
    case 'P':
      return ICState.POLYMORPHIC;
    case 'N':
      return ICState.MEGAMORPHIC;
    case 'G':
      return ICState.GENERIC;
    default:
      throw new Error('parse: unknown ic code state: ' + s);
  }
}

export function severityIcState(state) {
  switch (state) {
    case ICState.NO_FEEDBACK:
      return MIN_SEVERITY;
    case ICState.UNINITIALIZED:
      return MIN_SEVERITY;
    case ICState.PREMONOMORPHIC:
      return MIN_SEVERITY;
    case ICState.MONOMORPHIC:
      return MIN_SEVERITY;
    case ICState.RECOMPUTE_HANDLER:
      return MIN_SEVERITY;
    case ICState.POLYMORPHIC:
      return MIN_SEVERITY + 1;
    case ICState.MEGAMORPHIC:
      return MIN_SEVERITY + 2;
    case ICState.GENERIC:
      return MIN_SEVERITY + 2;
    default:
      throw new Error('severity: unknown ic code state : ' + state);
  }
}
