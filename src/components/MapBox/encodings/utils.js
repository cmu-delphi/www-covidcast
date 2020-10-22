import { scaleSqrt } from 'd3-scale';
import { parseScaleSpec } from '../../../stores/scales';
import { ZERO_COLOR, MISSING_COLOR } from '../../../theme';

export const MISSING_VALUE = -100;

/**
 *
 * @param {[string, number][]} stops
 * @param {import('../../../data').SensorEntry} sensor
 */
export function interpolateValue(stops, sensor) {
  const missing = [
    // when missing
    ['==', ['to-number', ['feature-state', 'value'], MISSING_VALUE], MISSING_VALUE],
    MISSING_COLOR,
  ];
  const zero = [
    // when 0
    ['==', ['to-number', ['feature-state', 'value'], MISSING_VALUE], sensor.neutralValue],
    ZERO_COLOR,
  ];
  const interpolate = [
    // else interpolate
    ['interpolate', ['linear'], ['to-number', ['feature-state', 'value'], 0], ...stops.flat()],
  ];
  if (sensor.isDiverging) {
    return ['case', ...missing, ...interpolate];
  }
  return ['case', ...missing, ...zero, ...interpolate];
}

export function createScale(sensorEntry, valueMinMax, rangeMax, scaleTheme) {
  if (sensorEntry.isDiverging) {
    const base = scaleSqrt()
      .domain([valueMinMax[0] - sensorEntry.divergingCenter, 0, valueMinMax[1] - sensorEntry.divergingCenter])
      .range([-rangeMax, 0, rangeMax])
      .clamp(true);
    return (v) => base(v - sensorEntry.divergingCenter);
  }
  const valueMax = valueMinMax[1];
  return parseScaleSpec(scaleTheme).domain([sensorEntry.neutralValue, valueMax]).range([0, rangeMax]).clamp(true);
}
