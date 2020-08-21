import { scaleSequential, scaleSequentialLog } from 'd3-scale';
import { interpolateYlOrRd } from 'd3-scale-chromatic';
import logspace from 'compute-logspace';
import { DIRECTION_THEME, MAP_THEME } from '../../theme';
import { zip, transparent } from '../../util';
import { MISSING_VALUE } from './encodings/utils';
import { primaryValue } from '../../stores/constants';

const MAGIC_MIN_STATS = 0.14;
const EXPLICIT_ZERO_OFFSET = 0.01;
const SMALL_TICK_COUNT = 5;
const TICK_COUNT = 7;

/**
 * @param {*} statsLookup
 * @param {import('../../stores/constants').SensorEntry} sensorEntry
 * @param {string} level
 * @param {import('../../stores/constants').CasesOrDeathOptions} signalOptions
 */
export function determineMinMax(statsLookup, sensorEntry, level, signalOptions) {
  // Customize min max values for deaths
  if (sensorEntry.isCount) {
    let key = sensorEntry.key + '_' + level;
    if (sensorEntry.isCasesOrDeath) {
      key += `_${primaryValue(sensorEntry, signalOptions)}`;
    }
    const stats = statsLookup.get(key);
    return [Math.max(MAGIC_MIN_STATS, stats.mean - 3 * stats.std), stats.mean + 3 * stats.std];
  }

  const stats = statsLookup.get(sensorEntry.key);
  return [Math.max(0, stats.mean - 3 * stats.std), stats.mean + 3 * stats.std];
}

/**
 * @param {import('../../stores/constants').SensorEntry} sensorEntry
 * @param {'value' || 'direction'} signalType
 * @param {[number, number]} valueMinMax
 */
export function determineColorScale(valueMinMax, signalType, sensorEntry) {
  if (signalType === 'value') {
    return determineValueColorScale(valueMinMax, sensorEntry);
  }
  // signalType is 'direction'
  return determineDirectionColorScale();
}

/**
 * @param {import('../../stores/constants').SensorEntry} sensorEntry
 * @param {[number, number]} valueMinMax
 */
function determineValueColorScale(valueMinMax, sensorEntry) {
  if (sensorEntry.isCount) {
    return countSignalColorScale(valueMinMax);
  }
  if (sensorEntry.isProp) {
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
  const domainStops7 = logspace(Math.log10(valueMinMax[0]), Math.log10(valueMinMax[1]), TICK_COUNT);

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

/**
 * @param {import('../../stores/constants').SensorEntry} sensorEntry
 * @param {[number, number]} valueMinMax
 */
function computeTicks(sensorEntry, valueMinMax, small) {
  const numTicks = small ? SMALL_TICK_COUNT : TICK_COUNT;
  if (sensorEntry.isCount) {
    const min = Math.log10(Math.max(1, valueMinMax[0]));
    const max = Math.log10(Math.max(2, valueMinMax[1]));
    return logspace(min, max, numTicks);
  }
  // manipulates valueMinMax in place!
  if (sensorEntry.format === 'raw') {
    valueMinMax[0] = Math.max(EXPLICIT_ZERO_OFFSET, valueMinMax[0]);
    return splitDomain(valueMinMax[0], valueMinMax[1], numTicks);
  }
  // percent
  valueMinMax[0] = Math.max(EXPLICIT_ZERO_OFFSET, valueMinMax[0]);
  valueMinMax[1] = Math.min(100, valueMinMax[1]);
  return splitDomain(valueMinMax[0], valueMinMax[1], numTicks);
}

/**
 * @param {Map<string, any>} stats
 * @param {import('../../stores/constants').SensorEntry} sensorEntry
 * @param {string} level
 * @param {((v: number) => string)} colorScale
 * @param {import('../../stores/constants').CasesOrDeathOptions} signalOptions
 */
export function generateLabels(stats, sensorEntry, level, colorScale, signalOptions, small = false) {
  const valueMinMax = stats ? determineMinMax(stats, sensorEntry, level, signalOptions) : null;

  if (!valueMinMax) {
    return {
      labels: [],
      high: '',
      valueMinMax: [0, 0],
    };
  }

  const ticks = computeTicks(sensorEntry, valueMinMax, small);

  return {
    low: sensorEntry.formatValue(0), // fixed 0
    lowValue: 0,
    lowColor: colorScale(0),
    labels: ticks.slice(0, -1).map((tick, i) => ({
      label: sensorEntry.formatValue(tick),
      value: tick,
      color: colorScale(tick),
      nextColor: colorScale(ticks[i + 1]),
    })),
    high: `${sensorEntry.formatValue(valueMinMax[1])}+`,
    highValue: valueMinMax[1],
    highColor: colorScale(valueMinMax[1]),
    valueMinMax,
  };
}
