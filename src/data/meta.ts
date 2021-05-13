import { EpiDataCasesOrDeathValues, primaryValue, CasesOrDeathOptions } from './classicSensor';
import type { EpiDataMetaInfo, EpiDataMetaStatsInfo } from './api';
import { parseAPITime } from './utils';
import type { RegionLevel } from './regions';
import { isCountSignal } from './signals';
import { ALL_TIME_FRAME, TimeFrame } from './TimeFrame';
import { Sensor, units, colorScales, formatter, vegaColorScales, yAxis } from './sensor';
import { getDataSource } from './dataSourceLookup';

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

export interface SensorLike {
  id: string;
  signal: string;
}

export interface OldSensorLike extends SensorLike {
  isCasesOrDeath?: boolean;
  casesOrDeathSignals?: Record<keyof EpiDataCasesOrDeathValues, string>;
}

function deriveMetaSensors(metadata: EpiDataMetaInfo[]): { list: Sensor[]; map: Map<string, Sensor> } {
  const byKey = new Map<string, Sensor>();
  const sensors = metadata.map(
    (m): Sensor => {
      const s: Sensor = {
        key: toKey(m.source, m.signal),
        id: m.source,
        signal: m.signal,
        name: m.name,
        description: 'No description available',
        signalTooltip: 'No tooltip available',
        valueScaleFactor: m.format === 'fraction' ? 100 : 1,
        format: m.format ?? 'raw',
        highValuesAre: m.high_values_are ?? 'neutral',
        hasStdErr: m.has_stderr,
        is7DayAverage: m.is_smoothed,
        dataSourceName: getDataSource({ id: m.source, signal: m.signal }),
        levels: Object.keys(m.geo_types) as RegionLevel[],
        type: m.category ?? 'other',
        xAxis: 'Date',
        yAxis: yAxis[m.format],
        unit: units[m.format],
        colorScale: colorScales[m.high_values_are],
        vegaColorScale: vegaColorScales[m.high_values_are],
        links: [],
        credits: 'We are happy for you to use this data in products and publications.',
        formatValue: formatter[m.format],
      };
      byKey.set(s.key, s);
      return s;
    },
  );

  // create raw links

  return { list: sensors, map: byKey };
}

export class MetaDataManager {
  private readonly cache: ReadonlyMap<string, EpiDataMetaParsedInfo>;
  public readonly metaSensors: readonly Sensor[];
  private readonly metaSensorsByKey: ReadonlyMap<string, Sensor>;

  constructor(metadata: EpiDataMetaInfo[]) {
    this.cache = new Map(metadata.map((d) => [toKey(d.source, d.signal), parse(d)]));

    const r = deriveMetaSensors(metadata);
    this.metaSensors = r.list;
    this.metaSensorsByKey = r.map;
  }

  getSensor(sensor: SensorLike): Sensor | null {
    return this.metaSensorsByKey.get(toKey(sensor.id, sensor.signal)) ?? null;
  }

  getMetaData(sensor: SensorLike): EpiDataMetaParsedInfo | null {
    return this.cache.get(toKey(sensor.id, sensor.signal)) ?? null;
  }

  getLevels(sensor: SensorLike): RegionLevel[] {
    const entry = this.getMetaData(sensor);
    return entry ? (Object.keys(entry.geo_types) as RegionLevel[]) : ['county'];
  }

  getStats(sensor: SensorLike, level?: RegionLevel): EpiDataMetaStatsInfo {
    const entry = this.getMetaData(sensor);
    return extractStats(sensor.signal, entry, level);
  }

  getTimeFrame(sensor: SensorLike): TimeFrame {
    const entry = this.getMetaData(sensor);
    if (!entry) {
      return ALL_TIME_FRAME;
    }
    return entry.timeFrame;
  }

  getMetaDataCompatibility(
    sensorEntry: OldSensorLike,
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
    sensorEntry: OldSensorLike,
    sensorOptions: Partial<CasesOrDeathOptions> = {},
    level?: RegionLevel,
  ): EpiDataMetaStatsInfo {
    const entry = this.getMetaDataCompatibility(sensorEntry, sensorOptions);
    return extractStats(entry ? entry.signal : sensorEntry.signal, entry, level);
  }

  getValueDomain(
    sensor: SensorLike,
    level: RegionLevel,
    { useMax = false, enforceZeroLike = true }: { useMax?: boolean; enforceZeroLike?: boolean } = {},
  ): [number, number] {
    const stats = this.getStats(sensor, level);
    return toValueDomain(stats, sensor.signal, useMax, enforceZeroLike);
  }

  getValueDomainCompatibility(
    sensorEntry: OldSensorLike,
    level: RegionLevel,
    signalOptions: Partial<CasesOrDeathOptions> = {},
    { useMax = false, enforceZeroLike = true }: { useMax?: boolean; enforceZeroLike?: boolean } = {},
  ): [number, number] {
    const stats = this.getStatsCompatibility(sensorEntry, signalOptions, level);
    return toValueDomain(stats, sensorEntry.signal, useMax, enforceZeroLike);
  }

  /**
   * returns the ids of related sensors to the given one
   */
  getRelatedSignals(sensor: SensorLike): SensorLike[] {
    const meta = this.getMetaData(sensor);
    if (!meta) {
      return [];
    }
    return (meta.related_signals ?? []).map((signal) => ({ id: sensor.id, signal }));
  }
}
