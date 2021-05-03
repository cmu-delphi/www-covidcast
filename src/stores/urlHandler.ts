import { loadFromUrlState, PersistedState, TrackedState, trackedUrlParams } from '.';
import throttle from 'lodash-es/throttle';

// Constantly keep the URL parameters updated with the current state.
export function updateURIParameters(state: TrackedState): void {
  // just update the current state
  const params = new URLSearchParams(window.location.search);

  // update params with state
  Object.keys(state.params).forEach((key) => {
    const v = state.params[key as keyof TrackedState['params']];
    if (v) {
      params.set(key, String(v));
    } else {
      params.delete(key);
    }
  });
  const path = `${((window as unknown) as { DELPHI_COVIDCAST_PAGE: string }).DELPHI_COVIDCAST_PAGE || '/'}${
    state.path
  }`;
  const query = params.toString();
  const url = `${path}${query.length > 0 ? '?' : ''}${query}${window.location.hash}`;

  // update only if the state has changed
  const old = (window.history.state || {}) as PersistedState;
  const deltaState: PersistedState = { ...state.state };
  // compute only the new changes
  (Object.keys(state.state) as (keyof PersistedState)[]).forEach((key) => {
    if (old[key] === deltaState[key]) {
      delete deltaState[key];
    }
  });
  const changedStateKeys = Object.keys(deltaState);
  if (changedStateKeys.length === 0) {
    // no change
    return;
  }
  // TODO what changes should trigger a history change
  const pushState = changedStateKeys.includes('mode') || changedStateKeys.includes('region');
  if (pushState) {
    window.history.pushState(state.state, document.title, url);
  } else {
    window.history.replaceState(state.state, document.title, url);
  }
}

export function updateHash(hash = ''): void {
  const url = new URL(window.location.href);
  url.hash = hash ? `#${hash}` : '';
  const old = (window.history.state ?? {}) as PersistedState;
  window.history.replaceState(old, document.title, url.toString());
}

trackedUrlParams.subscribe(throttle(updateURIParameters, 250));

window.addEventListener('popstate', (e) => {
  if (e.state && (e.state as PersistedState).mode) {
    loadFromUrlState(e.state);
  }
});
