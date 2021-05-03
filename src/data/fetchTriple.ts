import { EpiDataRow, parseData } from '.';
import type { Sensor } from '../stores/constants';
import { callAPI, GeoPair, SourceSignalPair, TimePair, isArray, EpiDataJSONRow } from './api';
import { levelMegaCountyId, RegionInfo as Region, RegionLevel } from './regions';
import type { TimeFrame } from './TimeFrame';
import { formatAPITime } from './utils';

function fixLevel(level: RegionLevel): RegionLevel {
  if (level === levelMegaCountyId) {
    // mega-counties are counties in the api
    return 'county';
  }
  return level;
}

function groupByLevel(regions: readonly Region[]): { level: RegionLevel; regions: string[] }[] {
  const map = new Map<RegionLevel, string[]>();
  for (const region of regions) {
    const entry = map.get(fixLevel(region.level));
    if (entry) {
      entry.push(region.propertyId);
    } else {
      map.set(fixLevel(region.level), [region.propertyId]);
    }
  }
  return Array.from(map.entries(), (r) => ({ level: r[0], regions: r[1] }));
}
function groupBySource(sensors: readonly Sensor[]): { source: string; sensors: Sensor[] }[] {
  const map = new Map<string, Sensor[]>();
  for (const source of sensors) {
    const entry = map.get(source.id);
    if (entry) {
      entry.push(source);
    } else {
      map.set(source.id, [source]);
    }
  }
  return Array.from(map.entries(), (r) => ({ source: r[0], sensors: r[1] }));
}

function toGeoPair(
  transfer: (keyof EpiDataJSONRow)[],
  mixinValues: Partial<EpiDataRow>,
  region: Region | RegionLevel | readonly Region[],
) {
  if (typeof region === 'string') {
    // single level
    mixinValues.geo_type = region;
    transfer.push('geo_value');
    return new GeoPair(region, '*');
  }
  if (!isArray(region)) {
    mixinValues.geo_type = region.level;
    mixinValues.geo_value = region.propertyId;
    return new GeoPair(fixLevel(region.level), region.propertyId);
  }
  const grouped = groupByLevel(region);
  if (grouped.length === 1) {
    mixinValues.geo_type = grouped[0].level;

    if (grouped[0].regions.length === 1) {
      mixinValues.geo_value = grouped[0].regions[0];
      return new GeoPair(grouped[0].level, grouped[0].regions[0]);
    }
    transfer.push('geo_value');
    return new GeoPair(grouped[0].level, grouped[0].regions);
  }
  transfer.push('geo_type', 'geo_value');
  return grouped.map((group) => new GeoPair(group.level, group.regions));
}

function toSourceSignalPair(
  transfer: (keyof EpiDataJSONRow)[],
  mixinValues: Partial<EpiDataRow>,
  sensor: Sensor | readonly Sensor[],
) {
  if (!isArray(sensor)) {
    mixinValues.source = sensor.id;
    mixinValues.signal = sensor.signal;
    return {
      factor: sensor.format === 'fraction' ? 100 : 1,
      sourceSignalPairs: new SourceSignalPair(sensor.id, sensor.signal),
    };
  }
  const grouped = groupBySource(sensor);

  let factor: number | ((row: EpiDataRow) => number);

  if (sensor.every((d) => d.format === 'fraction')) {
    factor = 100;
  } else if (sensor.every((d) => d.format !== 'fraction')) {
    factor = 1;
  } else {
    factor = (row: EpiDataRow) =>
      sensor.find((s) => s.id === row.source && s.signal == row.signal)?.format === 'fraction' ? 100 : 0;
  }
  if (grouped.length === 1) {
    mixinValues.source = grouped[0].source;

    const firstSensor = grouped[0].sensors[0];
    if (grouped[0].sensors.length === 1) {
      mixinValues.signal = firstSensor.signal;
      return {
        factor,
        sourceSignalPairs: new SourceSignalPair(firstSensor.id, firstSensor.signal),
      };
    }
    transfer.push('signal');
    return {
      factor,
      sourceSignalPairs: new SourceSignalPair(
        grouped[0].source,
        grouped[0].sensors.map((d) => d.signal),
      ),
    };
  }

  transfer.push('source', 'signal');
  return {
    factor,
    sourceSignalPairs: grouped.map(
      (group) =>
        new SourceSignalPair(
          group.source,
          group.sensors.map((d) => d.signal),
        ),
    ),
  };
}

export function toTimeValue(date: Date): number {
  return Number.parseInt(formatAPITime(date), 10);
}

export default function fetchTriple(
  sensor: Sensor | readonly Sensor[],
  region: Region | RegionLevel | readonly Region[],
  date: TimeFrame | Date,
  { advanced = false } = {},
): Promise<EpiDataRow[]> {
  const transfer: (keyof EpiDataJSONRow)[] = ['value', 'stderr'];
  if (advanced) {
    transfer.push('sample_size', 'issue');
  }
  const mixinValues: Partial<EpiDataRow> = {
    time_type: 'day',
  };
  const geoPairs = toGeoPair(transfer, mixinValues, region);
  const { sourceSignalPairs, factor } = toSourceSignalPair(transfer, mixinValues, sensor);

  const timePairs = new TimePair('day', date);
  if (date instanceof Date) {
    // single level
    mixinValues.time_value = toTimeValue(date);
  } else {
    transfer.push('time_value');
  }
  return callAPI(sourceSignalPairs, geoPairs, timePairs, transfer).then((rows) => parseData(rows, mixinValues, factor));
}
