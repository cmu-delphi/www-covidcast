import { primaryValue } from './constants';
import { CasesOrDeathOptions, getType } from './constants';
import type { RegionLevel } from '../data/regions';

const MAGIC_MIN_STATS = 0.14;

/**
 * @typedef {import('../../stores/constants').SensorEntry} SensorEntry
 */

const DEFAULT_STATS = { min: 0, max: 100, mean: 50, std: 10 };

export function resolveStats(
  statsLookup: Map<string, { max: number; mean: number; std: number }> | null,
  key: string,
): { max: number; mean: number; std: number } {
  const entry = statsLookup?.get(key);
  if (!entry) {
    return DEFAULT_STATS;
  }
  if ([entry.max, entry.std, entry.mean].some((d) => d == null || Number.isNaN(d))) {
    console.warn('invalid stats detected for', key);
    return DEFAULT_STATS;
  }
  return entry;
}

export function determineMinMax(
  statsLookup: Map<string, { max: number; mean: number; std: number }> | null,
  sensorEntry: { key: string; signal: string; isCasesOrDeath?: boolean },
  level: RegionLevel,
  signalOptions: Partial<CasesOrDeathOptions> = {},
  useMax = false,
  enforceZeroLike = true,
): [number, number] {
  let key = sensorEntry.key;
  // Customize min max values for deaths
  if (getType(sensorEntry, signalOptions) === 'count') {
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
