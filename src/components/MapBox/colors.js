import { isCountSignal, isPropSignal } from '../../data/signals';
import * as d3 from 'd3';
import logspace from 'compute-logspace';
import { DIRECTION_THEME, MAP_THEME } from '../../theme';
import { zip, transparent } from '../../util';
import { MISSING_VALUE } from './encodings/utils';

export function determineMinMax(statsLookup, sensor, level) {
  // Customize min max values for deaths
  if (isCountSignal(sensor)) {
    const stats = statsLookup.get(sensor + '_' + level);
    return [Math.max(0.14, stats.mean - 3 * stats.std), stats.mean + 3 * stats.std];
  }

  const stats = statsLookup.get(sensor);
  return [Math.max(0.14, stats.mean - 3 * stats.std), stats.mean + 3 * stats.std];
}

export function determineColorScale(valueMinMax, signalType, sensor) {
  if (signalType === 'value') {
    return determineValueColorScale(valueMinMax, sensor);
  }
  // signalType is 'direction'
  return determineDirectionColorScale();
}

function determineValueColorScale(valueMinMax, sensor) {
  if (isCountSignal(sensor)) {
    return countSignalColorScale(valueMinMax);
  }
  if (isPropSignal(sensor)) {
    return propSignalColorScale(valueMinMax);
  }
  return regularSignalColorScale(valueMinMax);
}

function determineDirectionColorScale() {
  const stops = [
    [MISSING_VALUE, MAP_THEME.countyFill],
    [-1, DIRECTION_THEME.decreasing],
    [0, DIRECTION_THEME.steady],
    [1, DIRECTION_THEME.increasing],
  ];
  const stopsMega = [
    [MISSING_VALUE, MAP_THEME.countyFill],
    [-1, DIRECTION_THEME.gradientMinMega],
    [0, DIRECTION_THEME.gradientMiddleMega],
    [1, DIRECTION_THEME.gradientMaxMega],
  ];

  return { stops, stopsMega };
}

function regularSignalColorScale(valueMinMax) {
  const center = valueMinMax[0] + (valueMinMax[1] - valueMinMax[0]) / 2,
    firstHalfCenter = valueMinMax[0] + (center - valueMinMax[0]) / 2,
    secondHalfCenter = center + (valueMinMax[1] - center) / 2;

  const colorScaleLinear = d3.scaleSequential(d3.interpolateYlOrRd).domain(valueMinMax);

  // domainStops5 is used for other cases (prop signals)
  const domainStops5 = [valueMinMax[0], firstHalfCenter, center, secondHalfCenter, valueMinMax[1]];

  const linearColors5 = domainStops5.map((c) => colorScaleLinear(c).toString());

  const stops = zip(domainStops5, linearColors5);
  const stopsMega = zip(domainStops5, transparent(linearColors5, 0.5));

  return { stops, stopsMega, scale: colorScaleLinear };
}

function propSignalColorScale(valueMinMax) {
  const center = valueMinMax[0] + (valueMinMax[1] - valueMinMax[0]) / 2;
  const firstHalfCenter = valueMinMax[0] + (center - valueMinMax[0]) / 2;
  const secondHalfCenter = center + (valueMinMax[1] - center) / 2;
  const colorScaleLinear = d3.scaleSequential(d3.interpolateYlOrRd).domain(valueMinMax);
  // domainStops5 is used for other cases (prop signals)
  const domainStops5 = [valueMinMax[0], firstHalfCenter, center, secondHalfCenter, valueMinMax[1]];
  const linearColors5 = domainStops5.map((c) => colorScaleLinear(c).toString());

  const stops = [[0, DIRECTION_THEME.countMin]].concat(zip(domainStops5, linearColors5));
  const stopsMega = zip(domainStops5, transparent(linearColors5, 0.5));
  return { stops, stopsMega, scale: colorScaleLinear };
}

function countSignalColorScale(valueMinMax) {
  const colorScaleLog = d3.scaleSequentialLog(d3.interpolateYlOrRd).domain(valueMinMax);

  // domainStops7 is used to determine the colors of regions for count signals.
  const domainStops7 = logspace(Math.log(valueMinMax[0]) / Math.log(10), Math.log(valueMinMax[1]) / Math.log(10), 7);

  const logColors7 = domainStops7.map((c) => colorScaleLog(c).toString());

  // use log scale
  const stops = [[0, DIRECTION_THEME.countMin]].concat(zip(domainStops7, logColors7));
  const stopsMega = [[0, DIRECTION_THEME.countMin]].concat(zip(domainStops7, logColors7));
  return { stops, stopsMega, scale: colorScaleLog };
}
