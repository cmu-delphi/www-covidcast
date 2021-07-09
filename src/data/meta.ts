import type { EpiDataMetaInfo, EpiDataMetaStatsInfo, SignalCategory } from './api';
import { parseAPITime } from './utils';
import type { RegionLevel } from './regions';
import { isCountSignal } from './signals';
import { ALL_TIME_FRAME, TimeFrame } from './TimeFrame';
import { Sensor, units, colorScales, vegaColorScales, yAxis } from './sensor';
import { getPlainDataSource } from './dataSourceLookup';
import { formatSpecifiers, formatter } from '../formats';

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

export interface SensorSource {
  readonly source: string;
  readonly name: string;
  readonly sensors: readonly Sensor[];
}

function deriveMetaSensors(metadata: EpiDataMetaInfo[]): {
  list: Sensor[];
  map: Map<string, [EpiDataMetaParsedInfo, Sensor]>;
  sources: SensorSource[];
} {
  const byKey = new Map<string, [EpiDataMetaParsedInfo, Sensor]>();
  const bySource = new Map<string, Sensor[]>();

  const sensors = metadata.map((m): Sensor => {
    const parsed = parse(m);
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
      dataSourceName: getPlainDataSource(m.source),
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
      formatSpecifier: formatSpecifiers[m.format],
    };
    byKey.set(s.key, [parsed, s]);
    const source = bySource.get(s.id);
    if (source) {
      source.push(s);
    } else {
      bySource.set(s.id, [s]);
    }
    return s;
  });

  byKey.forEach(([meta, sensor]) => {
    if (!meta.is_smoothed) {
      return;
    }
    const related = meta.related_signals
      .map((s) => byKey.get(toKey(sensor.id, s)))
      .filter((s): s is [EpiDataMetaParsedInfo, Sensor] => s != null);

    // find raw version
    const raw = related.find(
      // not smoothed
      ([m]) =>
        m.is_cumulative == meta.is_cumulative &&
        m.is_weighted == meta.is_weighted &&
        !m.is_smoothed &&
        m.format == meta.format,
    );
    if (raw) {
      Object.assign(sensor, {
        rawSensor: raw[1],
        rawSignal: raw[1].signal,
      });
    }

    // find raw cumulative version
    if (!meta.is_cumulative) {
      const rawCumulative = related.find(
        ([m]) => m.is_cumulative && m.is_weighted == meta.is_weighted && !m.is_smoothed && m.format == meta.format,
      );
      if (rawCumulative) {
        Object.assign(sensor, {
          rawCumulativeSensor: rawCumulative[1],
          rawCumulativeSignal: rawCumulative[1].signal,
        });
      }
    }
  });

  sensors.sort((a, b) => a.key.localeCompare(b.key));

  const sources: SensorSource[] = Array.from(bySource.values(), (v) => ({
    source: v[0].id,
    name: v[0].dataSourceName,
    sensors: v,
  }));

  return { list: sensors, map: byKey, sources };
}

export class MetaDataManager {
  private readonly lookup: ReadonlyMap<string, [EpiDataMetaParsedInfo, Sensor]>;
  readonly metaSensors: readonly Sensor[];
  readonly metaSources: readonly SensorSource[];

  constructor(metadata: EpiDataMetaInfo[]) {
    const r = deriveMetaSensors(metadata);
    this.metaSensors = r.list;
    this.metaSources = r.sources;
    this.lookup = r.map;
  }

  getDefaultCasesSignal(): Sensor | null {
    return this.getSensor({ id: 'indicator-combination', signal: 'confirmed_7dav_incidence_prop' });
  }
  getDefaultDeathSignal(): Sensor | null {
    return this.getSensor({ id: 'indicator-combination', signal: 'deaths_7dav_incidence_prop' });
  }

  getSensorsOfType(type: SignalCategory): Sensor[] {
    return this.metaSensors.filter((d) => d.type === type);
  }

  private getEntry(sensor: SensorLike | string): [EpiDataMetaParsedInfo | null, Sensor | null] {
    const r = this.lookup.get(typeof sensor === 'string' ? sensor : toKey(sensor.id, sensor.signal));
    return r ?? [null, null];
  }

  getSensor(sensor: SensorLike | string): Sensor | null {
    return this.getEntry(sensor)[1];
  }

  getMetaData(sensor: SensorLike | string): EpiDataMetaParsedInfo | null {
    return this.getEntry(sensor)[0];
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

  getValueDomain(
    sensor: SensorLike,
    level: RegionLevel,
    { useMax = false, enforceZeroLike = true }: { useMax?: boolean; enforceZeroLike?: boolean } = {},
  ): [number, number] {
    const stats = this.getStats(sensor, level);
    return toValueDomain(stats, sensor.signal, useMax, enforceZeroLike);
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
