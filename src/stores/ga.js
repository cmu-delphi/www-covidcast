import {
  currentSensor,
  currentLevel,
  currentRegion,
  currentDate,
  signalType,
  encoding,
  currentMode,
  signalCasesOrDeathOptions,
  currentCompareSelection,
} from '.';

export function trackUrl(url) {
  if (!window.ga) {
    return;
  }
  // send an event to google analytics
  window.ga('set', 'page', url);
  window.ga('send', 'pageview');
}

export function trackEvent(category, action, label, value) {
  if (!window.ga) {
    return;
  }
  window.ga('send', 'event', category, action, label, value);
}

currentSensor.subscribe((sensor) => trackEvent('sensor', 'set', sensor));
currentLevel.subscribe((level) => trackEvent('level', 'set', level));
currentRegion.subscribe((region) => trackEvent('region', 'set', region));
currentDate.subscribe((date) => trackEvent('date', 'set', date));
signalType.subscribe((signalType) => trackEvent('signalType', 'set', signalType));
encoding.subscribe((encoding) => trackEvent('encoding', 'set', encoding));
currentMode.subscribe((mode) => trackEvent('mode', 'set', mode.id));
signalCasesOrDeathOptions.subscribe((r) => {
  trackEvent('signalCasesOrDeathOptions', 'cumulative', String(r.cumulative));
  trackEvent('signalCasesOrDeathOptions', 'ratio', String(r.ratio));
});
currentCompareSelection.subscribe((compare) => {
  if (!compare) {
    trackEvent('compare', 'set', 'close');
  } else if (compare.length === 0) {
    trackEvent('compare', 'set', 'open');
  } else {
    trackEvent('compare', 'change', compare.map((d) => d.info.propertyId).join(','));
  }
});
