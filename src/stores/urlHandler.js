import { trackedUrlParams } from '.';
import throttle from 'lodash-es/throttle';

// Constantly keep the URL parameters updated with the current state.
export function updateURIParameters(state) {
  // just update the current state
  const params = new URLSearchParams(window.location.search);

  // update params with state
  Object.keys(state).forEach((key) => {
    const v = state[key];
    if (v) {
      params.set(key, v);
    } else {
      params.delete(key);
    }
  });
  window.history.replaceState(state, document.title, `?${params.toString()}`);
}

trackedUrlParams.subscribe(throttle(updateURIParameters, 250));
