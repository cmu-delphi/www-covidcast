import { currentSensor, currentRegion, currentDate, currentMode, appReady } from '.';

import { debounce } from 'lodash-es';

export const trackUrl = debounce((url) => {
  if (!window.ga) {
    return;
  }
  // send an event to google analytics
  window.ga('set', 'page', url);
  window.ga('send', 'pageview');
}, 250);

export function trackEvent(category, action, label, value) {
  if (!window.ga) {
    return;
  }
  window.ga('send', 'event', category, action, label, value);
}

appReady.subscribe((v) => {
  if (!v) {
    return;
  }
  let initialRun = true;
  currentSensor.subscribe((sensor) => {
    // since subscribe is run directly with the current value
    if (initialRun) {
      return;
    }
    trackEvent('sensor', 'set', sensor);
  });
  currentRegion.subscribe((region) => {
    if (initialRun) {
      return;
    }
    trackEvent('region', 'set', region);
  });
  currentDate.subscribe((date) => {
    if (initialRun) {
      return;
    }
    trackEvent('date', 'set', date);
  });
  currentMode.subscribe((mode) => {
    if (initialRun) {
      return;
    }
    trackEvent('mode', 'set', mode.id);
  });
  initialRun = false;
});
