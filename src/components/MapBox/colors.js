import { isCountSignal, isPropSignal } from '../../data/signals';
import { scaleSequential, scaleSequentialLog } from 'd3-scale';
import { interpolateYlOrRd } from 'd3-scale-chromatic';
import logspace from 'compute-logspace';
import { DIRECTION_THEME, MAP_THEME } from '../../theme';
import { zip, transparent, pairAdjacent } from '../../util';
import { MISSING_VALUE } from './encodings/utils';

const MAGIC_MIN_STATS = 0.14;
const EXPLICIT_ZERO_OFFSET = 0.01;

export function determineMinMax(statsLookup, sensor, level) {
  // Customize min max values for deaths
  if (isCountSignal(sensor)) {
    const stats = statsLookup.get(sensor + '_' + level);
    return [Math.max(MAGIC_MIN_STATS, stats.mean - 3 * stats.std), stats.mean + 3 * stats.std];
  }

  const stats = statsLookup.get(sensor);
  return [Math.max(0, stats.mean - 3 * stats.std), stats.mean + 3 * stats.std];
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

  const colorScaleLinear = scaleSequential(interpolateYlOrRd).domain(valueMinMax);

  // domainStops5 is used for other cases (prop signals)
  const domainStops5 = [valueMinMax[0], firstHalfCenter, center, secondHalfCenter, valueMinMax[1]];

  const linearColors5 = domainStops5.map((c) => colorScaleLinear(c).toString());

  const stops = zip(domainStops5, linearColors5);
  const stopsMega = zip(domainStops5, transparent(linearColors5, 0.5));

  return { stops, stopsMega, scale: colorScaleLinear };
}

function propSignalColorScale(valueMinMax) {
  const min = Math.max(valueMinMax[0], EXPLICIT_ZERO_OFFSET);
  const max = Math.max(min + 0.01, valueMinMax[1]);

  const center = min + (max - min) / 2;
  const firstHalfCenter = min + (center - min) / 2;
  const secondHalfCenter = center + (max - center) / 2;
  const colorScaleLinear = scaleSequential(interpolateYlOrRd).domain(valueMinMax);
  // domainStops5 is used for other cases (prop signals)
  const domainStops5 = [min, firstHalfCenter, center, secondHalfCenter, max];
  const linearColors5 = domainStops5.map((c) => colorScaleLinear(c).toString());

  const stops = [[0, DIRECTION_THEME.countMin]].concat(zip(domainStops5, linearColors5));
  const stopsMega = zip(domainStops5, transparent(linearColors5, 0.5));
  return { stops, stopsMega, scale: colorScaleLinear };
}

function countSignalColorScale(valueMinMax) {
  const colorScaleLog = scaleSequentialLog(interpolateYlOrRd).domain(valueMinMax);

  // domainStops7 is used to determine the colors of regions for count signals.
  const domainStops7 = logspace(Math.log(valueMinMax[0]) / Math.log(10), Math.log(valueMinMax[1]) / Math.log(10), 7);

  const logColors7 = domainStops7.map((c) => colorScaleLog(c).toString());

  // use log scale
  const stops = [[0, DIRECTION_THEME.countMin]].concat(zip(domainStops7, logColors7));
  const stopsMega = [[0, DIRECTION_THEME.countMin]].concat(zip(domainStops7, logColors7));
  return { stops, stopsMega, scale: colorScaleLog };
}

export function splitDomain(min, max, parts) {
  const splits = [min];
  const increment = (max - min) / parts;
  for (let i = 1; i < parts; i++) {
    splits.push(splits[i - 1] + increment);
  }
  splits.push(max);
  return splits;
}

export function getSigfigs(value, sigFigs) {
  return parseFloat(parseFloat(value).toPrecision(sigFigs));
}

function arr2labels(arr) {
  const labels = [];
  for (let i = 0; i < arr.length; i++) {
    arr[i] = Number.parseFloat(arr[i]).toFixed(2);
    labels.push(arr[i]);
  }
  return labels;
}

export function generateLabels(stats, sensorEntry, level) {
  const valueMinMax = stats ? determineMinMax(stats, sensorEntry.key, level) : null;

  if (!valueMinMax) {
    return {
      labels: [],
      high: '',
      unit: '',
      valueMinMax: [0, 0],
    };
  }

  if (!isCountSignal(sensorEntry.key)) {
    valueMinMax[0] = Math.max(EXPLICIT_ZERO_OFFSET, valueMinMax[0]);
  }

  let high = getSigfigs(valueMinMax[1].toFixed(2), 3);
  let unit = '';

  if (isCountSignal(sensorEntry.key)) {
    const min = Math.log(valueMinMax[0]) / Math.log(10);
    const max = Math.log(valueMinMax[1]) / Math.log(10);
    const arr = logspace(min, max, 7);

    const labels = ['0', ...arr2labels(arr)];
    return {
      labels: pairAdjacent(labels),
      high,
      unit,
      valueMinMax,
    };
  }

  if (sensorEntry.format === 'raw') {
    valueMinMax[0] = Math.max(0, valueMinMax[0]);
  } else {
    // otherwise, it's 'percent'.
    high = getSigfigs(Math.min(100, valueMinMax[1]).toFixed(2), 3);
    unit = '%';
    valueMinMax[0] = Math.max(0, valueMinMax[0]);
    valueMinMax[1] = Math.min(100, valueMinMax[1]);
  }

  const arr = splitDomain(valueMinMax[0], valueMinMax[1], 7);
  const labels = ['0', ...arr2labels(arr)];

  return {
    labels: pairAdjacent(labels),
    high,
    unit,
    valueMinMax,
  };
}
