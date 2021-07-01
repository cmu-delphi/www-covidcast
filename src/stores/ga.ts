import { currentSensor, currentRegion, currentDate, currentMode, appReady, currentInfoSensor } from '.';

import debounce from 'lodash-es/debounce';

interface GoogleAnalyticsLike {
  (type: 'set', page: string, value: string): void;
  (type: 'send', sub: 'pageview'): void;
  (type: 'send', sub: 'event', category: string, action: string, label?: string, value?: string): void;
}

function hasGA(obj: unknown): obj is { ga: GoogleAnalyticsLike } {
  return (obj as { ga: GoogleAnalyticsLike }).ga != null;
}

export const trackUrl = debounce((url) => {
  if (!hasGA(window)) {
    return;
  }
  // send an event to google analytics
  window.ga('set', 'page', url);
  window.ga('send', 'pageview');
}, 250);

export function trackEvent(category: string, action: string, label?: string, value?: string): void {
  if (!hasGA(window)) {
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
  currentInfoSensor.subscribe((r) => {
    if (initialRun) {
      return;
    }
    if (!r) {
      trackEvent('help', 'hide-signal');
    } else {
      trackEvent('help', 'show-signal', r.key);
    }
  });

  initialRun = false;
});
