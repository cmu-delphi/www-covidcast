import { EpiDataCasesOrDeathValues, primaryValue, CasesOrDeathOptions } from '../stores/constants';
import type { EpiDataMetaInfo, EpiDataMetaStatsInfo } from './api';
import { parseAPITime } from './utils';
import type { RegionLevel } from './regions';
import { isCountSignal } from './signals';
import { ALL_TIME_FRAME, TimeFrame } from './TimeFrame';

function toKey(source: string, signal: string) {
  return `${source}-${signal}`;
}

const INVALID_STATS: EpiDataMetaStatsInfo = { min: 0, max: 100, mean: 50, stdev: 10 };

const MAGIC_MIN_STATS = 0.14;

function extractStats(signal: string, entry: EpiDataMetaInfo | null, level?: RegionLevel): EpiDataMetaStatsInfo {
  if (!entry || Object.keys(entry.geo_types).length === 0) {
    return INVALID_STATS;
  }
  const isCount = isCountSignal(signal);
  if (isCount && level != null) {
    // use level specific ones
    const byLevel = entry.geo_types[level];
    if (byLevel) {
      return byLevel;
    }
  }
  const countyLevel = entry.geo_types.county;
  if (countyLevel) {
    return countyLevel;
  }
  const nationLevel = entry.geo_types.nation;
  if (nationLevel) {
    return nationLevel;
  }
  // take first one
  return [...Object.values(entry.geo_types)][0]!;
}

export interface EpiDataMetaParsedInfo extends EpiDataMetaInfo {
  maxIssue: Date;
  minTime: Date;
  maxTime: Date;
  timeFrame: TimeFrame;
}

function parse(d: EpiDataMetaInfo): EpiDataMetaParsedInfo {
  const minTime = parseAPITime(d.min_time);
  const maxTime = parseAPITime(d.max_time);
  return {
    ...d,
    maxIssue: parseAPITime(d.max_issue),
    minTime,
    maxTime,
    timeFrame: new TimeFrame(minTime, maxTime),
  };
}

function toValueDomain(
  stats: EpiDataMetaStatsInfo,
  signal: string,
  useMax: boolean,
  enforceZeroLike: boolean,
): [number, number] {
  // Customize min max values for deaths
  if (isCountSignal(signal)) {
    if (useMax) {
      return [0, stats.max];
    }
    return [
      Math.max(enforceZeroLike ? MAGIC_MIN_STATS : Number.NEGATIVE_INFINITY, stats.mean - 3 * stats.stdev),
      stats.mean + 3 * stats.stdev,
    ];
  }

  if (useMax) {
    return [0, stats.max];
  }
  return [
    Math.max(enforceZeroLike ? 0 : Number.NEGATIVE_INFINITY, stats.mean - 3 * stats.stdev),
    stats.mean + 3 * stats.stdev,
  ];
}

export class MetaDataManager {
  private readonly cache: Map<string, EpiDataMetaParsedInfo>;
  constructor(metadata: EpiDataMetaInfo[]) {
    this.cache = new Map(metadata.map((d) => [toKey(d.source, d.signal), parse(d)]));
  }

  getMetaData(sensor: { id: string; signal: string }): EpiDataMetaParsedInfo | null {
    return this.cache.get(toKey(sensor.id, sensor.signal)) ?? null;
  }

  getLevels(sensor: { id: string; signal: string }): RegionLevel[] {
    const entry = this.getMetaData(sensor);
    return entry ? (Object.keys(entry.geo_types) as RegionLevel[]) : ['county'];
  }

  getStats(sensor: { id: string; signal: string }, level?: RegionLevel): EpiDataMetaStatsInfo {
    const entry = this.getMetaData(sensor);
    return extractStats(sensor.signal, entry, level);
  }

  getTimeFrame(sensor: { id: string; signal: string }): TimeFrame {
    const entry = this.getMetaData(sensor);
    if (!entry) {
      return ALL_TIME_FRAME;
    }
    return entry.timeFrame;
  }

  getMetaDataCompatibility(
    sensorEntry: {
      id: string;
      signal: string;
      isCasesOrDeath?: boolean;
      casesOrDeathSignals?: Record<keyof EpiDataCasesOrDeathValues, string>;
    },
    sensorOptions: Partial<CasesOrDeathOptions> = {},
  ): EpiDataMetaInfo | null {
    let signal = sensorEntry.signal;
    if (sensorEntry.isCasesOrDeath) {
      const valueKey = primaryValue(sensorEntry, sensorOptions) as keyof EpiDataCasesOrDeathValues;
      signal = sensorEntry.casesOrDeathSignals?.[valueKey] ?? sensorEntry.signal;
    }
    return this.getMetaData({ id: sensorEntry.id, signal });
  }

  getStatsCompatibility(
    sensorEntry: {
      id: string;
      signal: string;
      isCasesOrDeath?: boolean;
    },
    sensorOptions: Partial<CasesOrDeathOptions> = {},
    level?: RegionLevel,
  ): EpiDataMetaStatsInfo {
    const entry = this.getMetaDataCompatibility(sensorEntry, sensorOptions);
    return extractStats(entry ? entry.signal : sensorEntry.signal, entry, level);
  }

  getValueDomain(
    sensor: { id: string; signal: string },
    level: RegionLevel,
    { useMax = false, enforceZeroLike = true }: { useMax?: boolean; enforceZeroLike?: boolean } = {},
  ): [number, number] {
    const stats = this.getStats(sensor, level);
    return toValueDomain(stats, sensor.signal, useMax, enforceZeroLike);
  }

  getValueDomainCompatibility(
    sensorEntry: {
      id: string;
      signal: string;
      isCasesOrDeath?: boolean;
    },
    level: RegionLevel,
    signalOptions: Partial<CasesOrDeathOptions> = {},
    { useMax = false, enforceZeroLike = true }: { useMax?: boolean; enforceZeroLike?: boolean } = {},
  ): [number, number] {
    const stats = this.getStatsCompatibility(sensorEntry, signalOptions, level);
    return toValueDomain(stats, sensorEntry.signal, useMax, enforceZeroLike);
  }
}
