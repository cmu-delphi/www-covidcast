import {
  currentSensor,
  currentLevel,
  currentRegion,
  currentMode,
  currentDate,
  signalType,
  encoding,
  signalShowCumulative,
} from '.';
import { get } from 'svelte/store';
import { trackUrl } from './ga';

// Constantly keep the URL parameters updated with the current state.
function updateURIParameters(delta) {
  const state = {
    sensor: get(currentSensor),
    level: get(currentLevel),
    region: get(currentRegion),
    date: get(currentDate),
    signalType: get(signalType),
    encoding: get(encoding),
    mode: get(currentMode).id,
    signalC: get(signalShowCumulative),
    ...delta, // inject current delta
  };

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

  trackUrl(`?${params.toString()}`);
}

// Keep the URL updated with the current state
currentSensor.subscribe((sensor) =>
  updateURIParameters({
    sensor,
  }),
);
currentLevel.subscribe((level) =>
  updateURIParameters({
    level,
  }),
);
currentRegion.subscribe((region) => updateURIParameters({ region }));
currentDate.subscribe((date) => updateURIParameters({ date }));
signalType.subscribe((signalType) =>
  updateURIParameters({
    signalType,
  }),
);
signalShowCumulative.subscribe((signalC) =>
  updateURIParameters({
    signalC,
  }),
);
encoding.subscribe((encoding) => updateURIParameters({ encoding }));
currentMode.subscribe((mode) => updateURIParameters({ mode: mode.id }));
