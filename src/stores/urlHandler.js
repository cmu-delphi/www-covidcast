import { trackedUrlParams } from '.';
import throttle from 'lodash-es/throttle';

// Constantly keep the URL parameters updated with the current state.
export function updateURIParameters(state) {
  // just update the current state
  const params = new URLSearchParams(window.location.search);

  // update params with state
  Object.keys(state.params).forEach((key) => {
    const v = state.params[key];
    if (v) {
      params.set(key, v);
    } else {
      params.delete(key);
    }
  });
  const path = `${window.DELPHI_COVIDCAST_PAGE || '/'}${state.path}`;
  window.history.replaceState(state, document.title, `${path}?${params.toString()}`);
}

trackedUrlParams.subscribe(throttle(updateURIParameters, 250));
