import { ZERO_COLOR, MISSING_COLOR } from '../../../theme';

export const MISSING_VALUE = -100;

export function interpolateValue(stops) {
  return [
    'case',
    // when missing
    ['==', ['to-number', ['feature-state', 'value'], MISSING_VALUE], MISSING_VALUE],
    MISSING_COLOR,
    // when 0
    ['==', ['to-number', ['feature-state', 'value'], MISSING_VALUE], 0],
    ZERO_COLOR,
    // else interpolate
    ['interpolate', ['linear'], ['to-number', ['feature-state', 'value'], 0], ...stops.flat()],
  ];
}
