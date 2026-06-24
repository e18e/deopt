import { ICState } from '@e18e/deopt-shared';

export function nameIcState(state) {
  switch (state) {
    case ICState.NO_FEEDBACK:
      return 'no feedback';
    case ICState.UNINITIALIZED:
      return 'unintialized';
    case ICState.PREMONOMORPHIC:
      return 'premonomorphic';
    case ICState.MONOMORPHIC:
      return 'monomorphic';
    case ICState.RECOMPUTE_HANDLER:
      return 'recompute handler';
    case ICState.POLYMORPHIC:
      return 'polymorphic';
    case ICState.MEGAMORPHIC:
      return 'megamorphic';
    case ICState.GENERIC:
      return 'generic';
    default:
      throw new Error('name: unknown ic code state : ' + state);
  }
}
