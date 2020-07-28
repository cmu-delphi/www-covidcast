export function isCountSignal(signal) {
  return signal.match(/num/);
}

export function isPropSignal(signal) {
  return signal.match(/prop/);
}

export function getType(signal) {
  if (isCountSignal(signal)) return 'count';
  else if (isPropSignal(signal)) return 'prop';
  return 'other';
}

export function isDeathSignal(signal) {
  const deathsRegex = /deaths_/;
  return signal.match(deathsRegex);
}

export function isCasesSignal(signal) {
  const casesRegex = /confirmed_/;
  return signal.match(casesRegex);
}
