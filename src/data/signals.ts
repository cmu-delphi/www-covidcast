export function isCountSignal(signal: string): boolean {
  return /num/.exec(signal) != null;
}

export function isPropSignal(signal: string): boolean {
  return /prop/.exec(signal) != null;
}

export function isDeathSignal(signal: string): boolean {
  const deathsRegex = /deaths_/;
  return deathsRegex.exec(signal) != null && !signal.includes('deaths_percent_of_expected');
}

export function isCasesSignal(signal: string): boolean {
  const casesRegex = /confirmed_/;
  return casesRegex.exec(signal) != null;
}
