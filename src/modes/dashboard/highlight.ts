import { formatDateISO } from '../../formats';
import {
  CountyInfo,
  getHHSRegionOfState,
  getInfoByName,
  getStateOfCounty,
  getStatesOfHHS,
  HHSInfo,
  nationInfo,
  StateInfo,
} from '../../data/regions';
import { DateParam, Region, RegionLevel, RegionParam, Sensor, SensorParam, TimeFrame } from '../../stores/params';
import { EpiWeek } from '../../data/EpiWeek';
import { metaDataManager } from '../../stores';
import { get } from 'svelte/store';

function isArray<T>(v: T | readonly T[]): v is readonly T[] {
  return Array.isArray(v);
}

function regionKey(region: Region) {
  return `${region.id}@${region.level}`;
}

function levelKey(region: RegionLevel) {
  return `*@${region}`;
}

function levelFromKey(key: string): RegionLevel {
  return key.split('@')[1] as RegionLevel;
}

function regionFromKey(key: string): Region {
  const [id, level] = key.split('@');
  return getInfoByName(id, level as RegionLevel)!;
}

function equalIds(a: Set<string> | null | string, b: Set<string> | null | string): boolean {
  if (a === b) {
    return true;
  }
  if ((a == null) !== (b == null)) {
    return false;
  }
  if ((typeof a === 'string') !== (typeof b === 'string')) {
    return false;
  }
  if (typeof a === 'string' || typeof b === 'string') {
    return a === b;
  }
  // cannot happen should be covered by a === b
  if (a == null || b == null) {
    return false;
  }
  if (a.size !== b.size) {
    return false;
  }
  return [...a].every((d) => b.has(d));
}

function toStringIds(s: Set<string> | string | null) {
  if (s == null) {
    return '*';
  }
  if (typeof s === 'string') {
    return s;
  }
  return [...s].join(',');
}

export class WidgetHighlight {
  private readonly sensorIds: Set<string> | string | null;
  private readonly regionIds: Set<string> | string | null;

  constructor(
    sensor: null | Sensor | readonly Sensor[],
    region: null | Region | readonly Region[] | RegionLevel,
    private readonly date: null | Date | TimeFrame | EpiWeek,
  ) {
    if (isArray(sensor)) {
      if (sensor.length === 1) {
        this.sensorIds = sensor[0].key;
      } else {
        this.sensorIds = new Set();
        for (const s of sensor) {
          this.sensorIds.add(s.key);
        }
      }
    } else if (sensor) {
      this.sensorIds = sensor.key;
    } else {
      this.sensorIds = null;
    }
    if (typeof region === 'string') {
      this.regionIds = levelKey(region);
    }

    if (isArray(region)) {
      if (region.length === 1) {
        this.regionIds = regionKey(region[0]);
      } else {
        this.regionIds = new Set();
        for (const r of region) {
          this.regionIds.add(regionKey(r));
        }
      }
    } else if (region) {
      this.regionIds = regionKey(region as Region);
    } else {
      this.regionIds = null;
    }
  }

  get primaryDate(): Date | null {
    if (this.date == null) {
      return null;
    }
    if (this.date instanceof TimeFrame) {
      return this.date.min;
    }
    if (this.date instanceof EpiWeek) {
      return this.date.toDate();
    }
    return this.date;
  }

  get sensors(): '*' | Sensor[] {
    if (this.sensorIds == null) {
      return '*';
    }
    const m = get(metaDataManager);
    if (typeof this.sensorIds === 'string') {
      return [m.getSensor(this.sensorIds)!];
    }
    return [...this.sensorIds].map((d) => m.getSensor(d)!);
  }

  get primarySensor(): Sensor | null {
    const sensors = this.sensors;
    if (Array.isArray(sensors) && sensors.length > 0) {
      return sensors[0];
    }
    return null;
  }

  get regions(): '*' | RegionLevel | Region[] {
    if (this.regionIds == null) {
      return '*';
    }
    if (typeof this.regionIds === 'string') {
      return this.regionIds.startsWith('*') ? levelFromKey(this.regionIds) : [regionFromKey(this.regionIds)];
    }
    const ids = [...this.regionIds];
    const level = ids.find((d) => d.startsWith('*'));
    if (level) {
      return levelFromKey(level);
    }
    return ids.map((d) => regionFromKey(d));
  }

  get primaryRegion(): Region | null {
    const regions = this.regions;
    if (Array.isArray(regions) && regions.length > 0) {
      return regions[0];
    }
    return null;
  }

  equalDate(date: null | Date | TimeFrame | EpiWeek): boolean {
    if (this.date === date) {
      return true;
    }
    if (this.date instanceof Date && date instanceof Date) {
      return this.date.valueOf() == date.valueOf();
    }
    if (this.date instanceof TimeFrame && date instanceof TimeFrame) {
      return this.date.equals(date);
    }
    if (this.date instanceof EpiWeek && date instanceof EpiWeek) {
      return this.date.compareTo(date) == 0;
    }
    return false;
  }

  equals(that: WidgetHighlight | null): boolean {
    if (that == null) {
      return false;
    }
    return (
      equalIds(this.sensorIds, that.sensorIds) && equalIds(this.regionIds, that.regionIds) && this.equalDate(that.date)
    );
  }

  matchSensor(sensor: Sensor | SensorParam): boolean {
    if (this.sensorIds == null) {
      return true;
    }
    if (typeof this.sensorIds === 'string') {
      return this.sensorIds === sensor.key;
    }
    return this.sensorIds.has(sensor.key);
  }

  private matchRegionImpl(region: Region | RegionParam): boolean {
    if (this.regionIds == null) {
      return true;
    }
    const key = regionKey(region);
    const level = levelKey(region.level);
    if (typeof this.regionIds === 'string') {
      return this.regionIds === key || this.regionIds === level;
    }
    return this.regionIds.has(key) || this.regionIds.has(level);
  }

  matchRegion(region: Region | RegionParam): boolean {
    if (this.matchRegionImpl(region)) {
      return true;
    }
    if (region.level === 'nation' && this.matchLevel('state')) {
      // highlight down
      return true;
    }
    const regions = this.regions;
    if (!Array.isArray(regions)) {
      return false;
    }
    if (region.level === 'state') {
      // is a county of it selected
      return regions.some((d) => getStateOfCounty(d as CountyInfo) === region);
    }
    if (region.level === 'hhs') {
      // is a state of it selected
      const states = new Set(getStatesOfHHS(region as HHSInfo));
      return regions.some((d) => states.has(d as StateInfo));
    }
    return false;
  }

  matchLevel(level: RegionLevel): boolean {
    if (this.regionIds == null) {
      return true;
    }
    const key = levelKey(level);
    if (typeof this.regionIds === 'string') {
      return this.regionIds === key || this.regionIds.endsWith(`@${level}`);
    }
    return this.regionIds.has(key) || this.regionIds.has(level);
  }

  matchDate(date: Date | DateParam): boolean {
    const lDate = DateParam.unbox(date);
    if (this.date == null) {
      return true;
    }
    if (this.date instanceof Date) {
      return this.date.valueOf() == lDate.valueOf();
    }
    if (this.date instanceof TimeFrame) {
      return this.date.includes(lDate);
    }
    if (this.date instanceof EpiWeek) {
      return TimeFrame.fromEpiWeek(this.date).includes(lDate);
    }
    return false;
  }

  matchEpiWeek(week: EpiWeek): boolean {
    if (this.date == null) {
      return true;
    }
    if (this.date instanceof EpiWeek) {
      return this.date.compareTo(week) == 0;
    }
    const tf = TimeFrame.fromEpiWeek(week);
    if (this.date instanceof Date) {
      return tf.includes(this.date);
    }
    if (this.date instanceof TimeFrame) {
      return this.date.overlaps(tf);
    }
    return false;
  }

  matchTimeFrame(timeFrame: TimeFrame): boolean {
    if (this.date == null) {
      return true;
    }
    if (this.date instanceof TimeFrame) {
      return this.date.overlaps(timeFrame);
    }
    if (this.date instanceof Date) {
      return timeFrame.includes(this.date);
    }
    if (this.date instanceof EpiWeek) {
      return TimeFrame.fromEpiWeek(this.date).overlaps(timeFrame);
    }
    return false;
  }

  matches(
    sensor: Sensor | SensorParam,
    region: Region | RegionParam | RegionLevel,
    date: Date | DateParam | TimeFrame | EpiWeek,
  ): boolean {
    return (
      this.matchSensor(sensor) &&
      ((typeof region === 'string' && this.matchLevel(region)) ||
        (typeof region !== 'string' && this.matchRegion(region))) &&
      ((date instanceof Date && this.matchDate(date)) ||
        (date instanceof EpiWeek && this.matchEpiWeek(date)) ||
        (date instanceof TimeFrame && this.matchTimeFrame(date)))
    );
  }

  toString(): string {
    const sensor = toStringIds(this.sensorIds);
    const region = toStringIds(this.regionIds);
    const date = this.date == null ? '*' : this.date instanceof Date ? formatDateISO(this.date) : this.date.toString();
    return `(sensor=${sensor}, region=${region}, date=${date})`;
  }

  [Symbol.toStringTag](): string {
    return this.toString();
  }
}

export function highlightToRegions(level: RegionLevel, highlight: WidgetHighlight | null): Region[] | undefined {
  if (!highlight) {
    return undefined;
  }
  const regions = highlight.regions;
  if (!Array.isArray(regions)) {
    return undefined;
  }
  const directHit = regions.filter((d) => d.level === level);
  if (directHit.length > 0) {
    return directHit;
  }
  if (level === 'nation' && highlight.matchLevel('state')) {
    return [nationInfo];
  }
  if (level === 'state') {
    const states = new Set(regions.map((d) => getStateOfCounty(d as CountyInfo)));
    states.delete(null);
    if (states.size > 0) {
      return [...states] as Region[];
    }
    return undefined;
  }
  if (level === 'hhs') {
    const hhs = new Set(regions.map((d) => getHHSRegionOfState(d as StateInfo)));
    hhs.delete(null);
    if (hhs.size > 0) {
      return [...hhs] as Region[];
    }
    return undefined;
  }
  return undefined;
}
