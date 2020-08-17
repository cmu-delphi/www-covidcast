import { MISSING_VALUE } from './encodings/utils';
import { EPIDATA_CASES_OR_DEATH_VALUES } from '../../stores/constants';

export function toBorderSource(level) {
  return `${level}-border`;
}

export function toCenterSource(level) {
  return `${level}-centers`;
}

export const S = {
  bubble: 'bubble-source',
  spike: {
    fill: 'spike-fill-source',
    stroke: 'spike-stroke-source',
  },
  cityPoint: 'city-point',
};

export const valueProperties = {
  value: MISSING_VALUE,
  direction: MISSING_VALUE,
};
EPIDATA_CASES_OR_DEATH_VALUES.forEach((key) => {
  valueProperties[key] = MISSING_VALUE;
});
