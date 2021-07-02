import { EpiDataMetaInfo, EpiDataMetaStatsInfo, KNOWN_LICENSES, SignalCategory } from './api';
import { parseAPITime } from './utils';
import type { RegionLevel } from './regions';
import { isCountSignal } from './signals';
import { ALL_TIME_FRAME, TimeFrame } from './TimeFrame';
import { Sensor, units, colorScales, vegaColorScales, yAxis } from './sensor';
import { formatSpecifiers, formatter } from '../formats';
import { parse as parseMarkDown, parseInline } from 'marked';

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


function generateCredits(license: EpiDataMetaSourceInfo['license']) {
  if (!license) {
    return 'We are happy for you to use this data in products and publications.';
  }
  const known = KNOWN_LICENSES[license as keyof typeof KNOWN_LICENSES];
  if (known) {
    return `We are happy for you to use this data in products and publications under the terms of the <a href="${known.link}">${known.name}</a>.`;
  }
  return license;
}

export interface SensorSource {
  readonly source: string;
  readonly name: string;
  readonly sensors: readonly Sensor[];
}

export interface SensorSensor extends Sensor {
  meta: EpiDataMetaParsedInfo;
}

export interface SensorSource
  extends Readonly<Omit<EpiDataMetaSourceInfo, 'signals' | 'reference_signal' | 'db_source'>> {
  readonly sensors: readonly SensorSensor[];
  readonly referenceSensor?: SensorSensor;
  readonly credits: string;
}

function findRawSignal(sensor: SensorSensor, sensors: SensorSensor[]) {
  if (!sensor.meta.is_smoothed) {
    return undefined;
  }
  const meta = sensor.meta;
  const raw = sensors.find(
    (o) =>
      o.meta.signal_basename === meta.signal_basename &&
      o.meta.is_cumulative == meta.is_cumulative &&
      o.meta.is_weighted == meta.is_weighted &&
      !o.meta.is_smoothed &&
      o.meta.format == meta.format,
  );
  return raw;
}
function findRawCumulativeSignal(sensor: SensorSensor, sensors: SensorSensor[]) {
  if (sensor.meta.is_cumulative) {
    return undefined;
  }
  const meta = sensor.meta;
  const cum = sensors.find(
    (o) =>
      o.meta.signal_basename === meta.signal_basename &&
      o.meta.is_cumulative &&
      o.meta.is_weighted == meta.is_weighted &&
      !o.meta.is_smoothed &&
      o.meta.format == meta.format,
  );
  return cum;
}

function addDUALink(links: { alt: string; href: string }[], dua?: string | null) {
  if (dua) {
    return [...links, { alt: 'DUA', href: dua }];
  }
  return links;
}

function deriveMetaSensors(metadata: EpiDataMetaSourceInfo[]): {
  list: SensorSensor[];
  map: Map<string, SensorSensor>;
  sources: SensorSource[];
} {
  const sources = metadata.map((sm): SensorSource => {
    const credits = generateCredits(sm.license);
    const sensors: SensorSensor[] = sm.signals.map((m) => {
      const parsed = parse(m);
      const s: SensorSensor = {
        key: toKey(m.source, m.signal),
        id: m.source,
        signal: m.signal,
        name: m.name,
        description: m.description ? parseMarkDown(m.description.trim()) : '',
        signalTooltip: m.short_description ? parseInline(m.short_description) : '',
        valueScaleFactor: m.format === 'fraction' ? 100 : 1,
        format: m.format ?? 'raw',
        highValuesAre: m.high_values_are ?? 'neutral',
        hasStdErr: m.has_stderr,
        is7DayAverage: m.is_smoothed,
        dataSourceName: sm.name,
        levels: Object.keys(m.geo_types) as RegionLevel[],
        type: m.category ?? 'other',
        xAxis: m.time_label,
        yAxis: m.value_label || yAxis[m.format],
        unit: units[m.format],
        colorScale: colorScales[m.high_values_are],
        vegaColorScale: vegaColorScales[m.high_values_are],
        links: sm.link.map((d) => `<a href="${d.href}">${d.alt}</a>`),
        credits: credits,
        formatValue: formatter[m.format],
        formatSpecifier: formatSpecifiers[m.format],
        meta: parsed,
      };
      return s;
    });

    // inject raw versions and cumulative versions
    for (const s of sensors) {
      const raw = findRawSignal(s, sensors);
      if (raw) {
        Object.assign(s, {
          rawSensor: raw,
          rawSignal: raw.signal,
        });
      }
      const cum = findRawCumulativeSignal(s, sensors);
      if (cum) {
        Object.assign(s, {
          rawCumulativeSensor: cum,
          rawCumulativeSignal: cum.signal,
        });
      }
    }

    return {
      ...sm,
      link: addDUALink(sm.link, sm.dua),
      sensors,
      description: sm.description ? parseMarkDown(sm.description.trim()) : '',
      credits,
      referenceSensor: sm.reference_signal ? sensors.find((d) => d.signal === sm.reference_signal) : undefined,
    };
  });

  const sensors = sources.map((d) => d.sensors).flat();
  sensors.sort((a, b) => a.key.localeCompare(b.key));

  const byKey = new Map(sensors.map((s) => [s.key, s]));

  return { list: sensors, map: byKey, sources };
}


