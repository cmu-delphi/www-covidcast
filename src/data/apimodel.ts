import type { Region } from '../stores/params';
import { hhsInfo, hrrInfo, RegionLevel, stateInfo } from './regions';
import type { TimeFrame } from './TimeFrame';
import { formatAPITime, formatAPIWeekTime, parseAPITime } from './utils';

export function isArray<T>(v: T | readonly T[]): v is readonly T[] {
  return Array.isArray(v);
}

export class SourceSignalPair {
  constructor(public readonly source: string, public readonly signals: '*' | string | readonly string[]) {}

  static from(sensor: { id: string; signal: string }): SourceSignalPair {
    return new SourceSignalPair(sensor.id, sensor.signal);
  }

  static fromArray(sensors: readonly { id: string; signal: string }[]): SourceSignalPair | SourceSignalPair[] {
    if (sensors.length === 0) {
      return [];
    }
    if (sensors.length === 1) {
      return SourceSignalPair.from(sensors[0]);
    }
    return groupBySource(sensors).map(
      (s) =>
        new SourceSignalPair(
          s.source,
          s.sensors.map((d) => d.signal),
        ),
    );
  }

  toString(): string {
    return `${this.source}:${isArray(this.signals) ? this.signals.join(',') : this.signals}`;
  }
}

function isAllRegions(level: RegionLevel, regions: readonly unknown[]) {
  if (level === 'state' && regions.length === stateInfo.length) {
    return true;
  }
  if (level === 'nation' && regions.length === 1) {
    return true;
  }
  if (level === 'hhs' && regions.length === hhsInfo.length) {
    return true;
  }
  if (level === 'hrr' && regions.length === hrrInfo.length) {
    return true;
  }
  return false;
}

export class GeoPair {
  public readonly values: '*' | string | readonly string[];
  constructor(public readonly level: RegionLevel, values: '*' | string | readonly string[]) {
    if (isArray(values) && isAllRegions(level, values)) {
      this.values = '*';
    } else {
      this.values = values;
    }
  }

  static from(region: Region): GeoPair {
    return new GeoPair(region.level, region.propertyId);
  }

  static fromArray(regions: readonly Region[]): GeoPair | GeoPair[] {
    if (regions.length === 0) {
      return [];
    }
    if (regions.length === 1) {
      return GeoPair.from(regions[0]);
    }
    return groupByLevel(regions).map((s) => new GeoPair(s.level, s.regions));
  }

  toString(): string {
    return `${fixLevel(this.level)}:${isArray(this.values) ? this.values.join(',') : this.values}`.toLowerCase();
  }
}

export class TimePair {
  constructor(
    public readonly type: 'day' | 'week',
    public readonly values: '*' | Date | TimeFrame | readonly (Date | TimeFrame)[],
  ) {}

  static from(date: Date | TimeFrame): TimePair {
    return new TimePair('day', date);
  }

  toString(): string {
    const formatter = this.type === 'day' ? formatAPITime : formatAPIWeekTime;
    const encodeValues = () => {
      if (this.values === '*') {
        return '*';
      }
      if (this.values instanceof Date) {
        return formatter(this.values);
      }
      if (isArray(this.values)) {
        return this.values.map((d) => (d instanceof Date ? formatter(d) : d.asType(this.type).range)).join(',');
      }
      if (this.type === 'week') {
        // TODO hack for bug in epidata
        return this.values.asType(this.type).asListRange();
      }
      return this.values.asType(this.type).range;
    };
    return `${this.type}:${encodeValues()}`;
  }
}

export const START_TIME_RANGE = parseAPITime('20100101');
export const END_TIME_RANGE = parseAPITime('20500101');

export function fixLevel(level: RegionLevel): RegionLevel {
  if (level && level.endsWith('county')) {
    // mega-counties are counties in the api
    return 'county';
  }
  return level;
}

export function groupByLevel(
  regions: readonly { level: RegionLevel; propertyId: string }[],
): { level: RegionLevel; regions: string[] }[] {
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
export function groupBySource<T extends { id: string }>(sensors: readonly T[]): { source: string; sensors: T[] }[] {
  const map = new Map<string, T[]>();
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
