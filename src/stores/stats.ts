import { CasesOrDeathOptions, getType, primaryValue } from './constants';
import type { RegionLevel } from '../data/regions';
import type { IStatsInfo } from '.';

const MAGIC_MIN_STATS = 0.14;

const DEFAULT_STATS = { min: 0, max: 100, mean: 50, std: 10 };

export function resolveStats(
  statsLookup: Map<string, IStatsInfo> | null,
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
  statsLookup: Map<string, IStatsInfo> | null,
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

export function determineStatsInfo(
  statsLookup: Map<string, IStatsInfo> | null,
  sensorEntry: { key: string; signal: string; isCasesOrDeath?: boolean },
  level: RegionLevel,
  signalOptions: Partial<CasesOrDeathOptions> = {},
): IStatsInfo | null {
  if (!statsLookup) {
    return null;
  }
  let key = sensorEntry.key;
  // Customize min max values for deaths
  if (getType(sensorEntry, signalOptions) === 'count') {
    key += `_${level}`;
    if (sensorEntry.isCasesOrDeath) {
      key += `_${primaryValue(sensorEntry, signalOptions)}`;
    }
  } else if (sensorEntry.isCasesOrDeath) {
    key += `_${primaryValue(sensorEntry, signalOptions)}`;
  }
  return statsLookup.get(key) ?? null;
}
