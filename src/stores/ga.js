import {
  currentSensor,
  currentLevel,
  currentRegion,
  currentDate,
  signalType,
  encoding,
  currentMode,
  signalCasesOrDeathOptions,
  appReady,
} from '.';

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
  currentLevel.subscribe((level) => {
    if (initialRun) {
      return;
    }
    trackEvent('level', 'set', level);
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
  signalType.subscribe((signalType) => {
    if (initialRun) {
      return;
    }
    trackEvent('signalType', 'set', signalType);
  });
  encoding.subscribe((encoding) => {
    if (initialRun) {
      return;
    }
    trackEvent('encoding', 'set', encoding);
  });
  currentMode.subscribe((mode) => {
    if (initialRun) {
      return;
    }
    trackEvent('mode', 'set', mode.id);
  });
  signalCasesOrDeathOptions.subscribe((r) => {
    if (initialRun) {
      return;
    }
    trackEvent('signalCasesOrDeathOptions', 'cumulative', String(r.cumulative));
    trackEvent('signalCasesOrDeathOptions', 'ratio', String(r.ratio));
  });
  initialRun = false;
});
