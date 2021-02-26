import { scaleSequential, scaleSequentialLog } from 'd3-scale';
import logspace from 'compute-logspace';
import { ZERO_COLOR } from '../../theme';
import { zip } from '../../util';
import { primaryValue } from '../../stores/constants';

const MAGIC_MIN_STATS = 0.14;
const SMALL_TICK_COUNT = 5;
const TICK_COUNT = 7;

/**
 * @typedef {import('../../stores/constants').SensorEntry} SensorEntry
 */

const DEFAULT_STATS = { min: 0, max: 100, mean: 50, std: 10 };

export function resolveStatsKey(sensorEntry, level, signalOptions = {}) {
  let key = sensorEntry.key;
  // Customize min max values for deaths
  if (sensorEntry.getType(signalOptions) === 'count') {
    key += `_${level}`;
    if (sensorEntry.isCasesOrDeath) {
      key += `_${primaryValue(sensorEntry, signalOptions)}`;
    }
    return key;
  }

  if (sensorEntry.isCasesOrDeath) {
    key += `_${primaryValue(sensorEntry, signalOptions)}`;
  }
  return key;
}

export function resolveStats(statsLookup, key) {
  if (!statsLookup || !statsLookup.has(key)) {
    return DEFAULT_STATS;
  }
  const entry = statsLookup.get(key);
  if ([entry.max, entry.std, entry.mean].some((d) => d == null || Number.isNaN(d))) {
    console.warn('invalid stats detected for', key);
    return DEFAULT_STATS;
  }
  return entry;
}
/**
 * @param {*} statsLookup
 * @param {SensorEntry} sensorEntry
 * @param {string} level
 * @param {import('../../stores/constants').CasesOrDeathOptions} signalOptions
 */
export function determineMinMax(
  statsLookup,
  sensorEntry,
  level,
  signalOptions,
  useMax = false,
  enforceZeroLike = true,
) {
  let key = sensorEntry.key;
  // Customize min max values for deaths
  if (sensorEntry.getType(signalOptions) === 'count') {
    key += `_${level}`;
    if (sensorEntry.isCasesOrDeath) {
      key += `_${primaryValue(sensorEntry, signalOptions)}`;
    }
    const stats = resolveStats(statsLookup, key);
    if (useMax) {
      return [0, stats.max];
    }
    return [
      Math.max(enforceZeroLike ? MAGIC_MIN_STATS : Number.NEGATIVE_INFINITY, stats.mean - 3 * stats.std),
      stats.mean + 3 * stats.std,
    ];
  }

  if (sensorEntry.isCasesOrDeath) {
    key += `_${primaryValue(sensorEntry, signalOptions)}`;
  }
  const stats = resolveStats(statsLookup, key);
  if (useMax) {
    return [0, stats.max];
  }
  return [
    Math.max(enforceZeroLike ? 0 : Number.NEGATIVE_INFINITY, stats.mean - 3 * stats.std),
    stats.mean + 3 * stats.std,
  ];
}

/**
 * @param {SensorEntry} sensorEntry
 * @param {'prop' | 'count' | 'other'} sensorType
 * @param {[number, number]} valueMinMax
 */
export function determineColorScale(valueMinMax, sensorEntry, sensorType) {
  if (sensorType === 'count') {
    return countSignalColorScale(valueMinMax, sensorEntry);
  }
  if (sensorType === 'prop') {
    return propSignalColorScale(valueMinMax, sensorEntry);
  }
  return regularSignalColorScale(valueMinMax, sensorEntry);
}

/**
 * @param {SensorEntry} sensorEntry
 * @param {[number, number]} valueMinMax
 */
function regularSignalColorScale(valueMinMax, sensorEntry) {
  const center = valueMinMax[0] + (valueMinMax[1] - valueMinMax[0]) / 2;
  const firstHalfCenter = valueMinMax[0] + (center - valueMinMax[0]) / 2;
  const secondHalfCenter = center + (valueMinMax[1] - center) / 2;

  const colorScaleLinear = scaleSequential(sensorEntry.colorScale).domain(valueMinMax);

  // domainStops5 is used for other cases (prop signals)
  const domainStops5 = [valueMinMax[0], firstHalfCenter, center, secondHalfCenter, valueMinMax[1]];

  const linearColors5 = domainStops5.map((c) => colorScaleLinear(c).toString());

  const stops = zip(domainStops5, linearColors5);
  return { stops, scale: colorScaleLinear };
}

/**
 * @param {SensorEntry} sensorEntry
 * @param {[number, number]} valueMinMax
 */
function propSignalColorScale(valueMinMax, sensorEntry) {
  const min = Math.max(valueMinMax[0], 0);
  const max = Math.max(min + 0.01, valueMinMax[1]);

  const center = min + (max - min) / 2;
  const firstHalfCenter = min + (center - min) / 2;
  const secondHalfCenter = center + (max - center) / 2;
  const colorScaleLinear = scaleSequential(sensorEntry.colorScale).domain(valueMinMax);
  // domainStops5 is used for other cases (prop signals)
  const domainStops5 = [min, firstHalfCenter, center, secondHalfCenter, max];
  const linearColors5 = domainStops5.map((c) => colorScaleLinear(c).toString());

  const stops = zip(domainStops5, linearColors5);
  return { stops, scale: colorScaleLinear };
}

/**
 * @param {SensorEntry} sensorEntry
 * @param {[number, number]} valueMinMax
 */
function countSignalColorScale(valueMinMax, sensorEntry) {
  const colorScaleLog = scaleSequentialLog(sensorEntry.colorScale).domain(valueMinMax);

  // domainStops7 is used to determine the colors of regions for count signals.
  const domainStops7 = logspace(Math.log10(valueMinMax[0]), Math.log10(valueMinMax[1]), TICK_COUNT);

  const logColors7 = domainStops7.map((c) => colorScaleLog(c).toString());

  // use log scale
  const stops = zip(domainStops7, logColors7);
  return { stops, scale: colorScaleLog };
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
 * @param {SensorEntry} sensorEntry
 * @param {import('../../stores/constants').CasesOrDeathOptions} signalOptions
 * @param {[number, number]} valueMinMax
 */
function computeTicks(sensorEntry, signalOptions, valueMinMax, small) {
  const numTicks = small ? SMALL_TICK_COUNT : TICK_COUNT;
  if (sensorEntry.getType(signalOptions) === 'count') {
    const min = Math.log10(Math.max(10e-3, valueMinMax[0]));
    const max = Math.log10(Math.max(10e-2, valueMinMax[1]));
    return logspace(min, max, numTicks);
  }
  // manipulates valueMinMax in place!
  if (sensorEntry.format === 'raw') {
    valueMinMax[0] = Math.max(0, valueMinMax[0]);
    return splitDomain(valueMinMax[0], valueMinMax[1], numTicks);
  }
  // percent
  valueMinMax[0] = Math.max(0, valueMinMax[0]);
  valueMinMax[1] = Math.min(100, valueMinMax[1]);
  return splitDomain(valueMinMax[0], valueMinMax[1], numTicks);
}

/**
 * @param {Map<string, any>} stats
 * @param {SensorEntry} sensorEntry
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

  const ticks = computeTicks(sensorEntry, signalOptions, valueMinMax, small);

  return {
    low: sensorEntry.formatValue(0), // fixed 0
    lowValue: 0,
    lowColor: ZERO_COLOR,
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
