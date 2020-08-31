import { MAP_THEME, ZERO_COLOR } from '../../../theme';

export function caseHoveredOrSelected(thenCase, elseCase, invert = false) {
  return [
    'case',
    ['any', ['to-boolean', ['feature-state', 'hover']], ['to-boolean', ['feature-state', 'select']]],
    invert ? elseCase : thenCase,
    invert ? thenCase : elseCase,
  ];
}
export function caseSelected(thenCase, elseCase, invert = false) {
  return [
    'case',
    ['to-boolean', ['feature-state', 'select']],
    invert ? elseCase : thenCase,
    invert ? thenCase : elseCase,
  ];
}

export const MISSING_VALUE = -100;
export const HAS_VALUE = ['>', ['to-number', ['feature-state', 'value'], MISSING_VALUE], 0];
export const IS_NOT_MISSING = ['!=', ['to-number', ['feature-state', 'value'], MISSING_VALUE], MISSING_VALUE];

export function caseMissing(thenCase, elseCase) {
  return [
    'case',
    // when missing
    ['==', ['to-number', ['feature-state', 'value'], MISSING_VALUE], MISSING_VALUE],
    thenCase,
    // else interpolate
    elseCase,
  ];
}

export function interpolateValue(stops) {
  return [
    'case',
    // when missing
    ['==', ['to-number', ['feature-state', 'value'], MISSING_VALUE], MISSING_VALUE],
    MAP_THEME.countyFill,
    // when 0
    ['==', ['to-number', ['feature-state', 'value'], MISSING_VALUE], 0],
    ZERO_COLOR,
    // else interpolate
    ['interpolate', ['linear'], ['to-number', ['feature-state', 'value'], 0], ...stops.flat()],
  ];
}
