import { primaryValue } from '../../stores/constants';

const MAGIC_MIN_STATS = 0.14;

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
