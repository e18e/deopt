import { signal, computed, effect } from '@preact/signals';
import { listDiagnostics } from '@e18e/deopt-shared';
import { urlFromState, stateFromUrl } from './query-state.js';

export const FILES_TAB_IDX = 0;
export const DETAILS_TAB_IDX = 1;

export const groups = signal(new Map());
export const selectedFile = signal(null);
export const selectedLocation = signal(null);
export const locationSeq = signal(0);
export const includeAllSeverities = signal(false);
export const selectedTabIdx = signal(FILES_TAB_IDX);

const indexedGroups = computed(() => Array.from(groups.value));

export const currentGroup = computed(() => {
  const file = selectedFile.value;
  if (file == null) return null;
  return groups.value.get(file) ?? null;
});

export const currentDiagnostics = computed(() =>
  listDiagnostics(currentGroup.value, {
    includeAllSeverities: includeAllSeverities.value,
  }),
);

export const selectedLine = computed(() => {
  const id = selectedLocation.value;
  const group = currentGroup.value;
  if (id == null || group == null) return null;
  for (const map of [group.deopts, group.ics, group.codes]) {
    if (map == null) continue;
    for (const info of map.values()) {
      if (info.id === id) return info.line;
    }
  }
  return null;
});

function indexFromFile(file) {
  const arr = indexedGroups.value;
  for (let i = 0; i < arr.length; i++) {
    if (arr[i][0] === file) return i;
  }
  return -1;
}

function fileFromIndex(idx) {
  if (idx == null || idx < 0) return null;
  const entry = indexedGroups.value[idx];
  return entry == null ? null : entry[0];
}

/*
 * Actions
 */
export function selectFile(file) {
  selectedFile.value = file;
  selectedLocation.value = null;
  // auto open details view when file is selected
  selectedTabIdx.value = DETAILS_TAB_IDX;
}

export function selectLocation(id) {
  selectedLocation.value = id;
  locationSeq.value = locationSeq.value + 1;
}

export function selectTab(idx) {
  selectedTabIdx.value = idx;
}

export function setIncludeAllSeverities(value) {
  includeAllSeverities.value = value;
  selectedLocation.value = null;
}

export function selectMarker(id) {
  selectLocation(id);
}

/*
 * History / URL sync
 */
function applyState(state) {
  selectedFile.value = fileFromIndex(state.selectedFileIdx);
  selectedLocation.value =
    state.selectedLocation === '' ? null : state.selectedLocation;
  if (state.includeAllSeverities != null) {
    includeAllSeverities.value = state.includeAllSeverities;
  }
  if (state.selectedTabIdx != null) {
    selectedTabIdx.value = state.selectedTabIdx;
  }
}

let restoring = false;

export function initHistorySync() {
  const initial = stateFromUrl();
  if (initial != null) applyState(initial);

  window.addEventListener('popstate', () => {
    if (history.state == null) return;
    restoring = true;
    applyState(history.state);
    restoring = false;
  });

  let started = false;
  effect(() => {
    const state = {
      selectedFileIdx: indexFromFile(selectedFile.value),
      selectedLocation: selectedLocation.value,
      includeAllSeverities: includeAllSeverities.value,
      selectedTabIdx: selectedTabIdx.value,
    };
    // popstate already reflects this state in history; don't push it back
    if (restoring) return;
    if (started) {
      history.pushState(state, 'deopt', urlFromState(state));
    } else {
      // seed the base entry so the first Back press is restorable
      history.replaceState(state, 'deopt', urlFromState(state));
    }
    started = true;
  });
}
