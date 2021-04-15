import { formatDateISO } from '../../formats';
import { getInfoByName } from '../../maps/infos';
import { sensorMap } from '../../stores';
import { Region, RegionLevel, Sensor, TimeFrame } from '../../stores/params';

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
    private readonly date: null | Date | TimeFrame,
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
    return this.date;
  }

  get sensors(): '*' | Sensor[] {
    if (this.sensorIds == null) {
      return '*';
    }
    if (typeof this.sensorIds === 'string') {
      return [sensorMap.get(this.sensorIds)!];
    }
    return [...this.sensorIds].map((d) => sensorMap.get(d)!);
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

  equalDate(date: null | Date | TimeFrame): boolean {
    if (this.date === date) {
      return true;
    }
    if (this.date instanceof Date && date instanceof Date) {
      return this.date.valueOf() == date.valueOf();
    }
    if (this.date instanceof TimeFrame && date instanceof TimeFrame) {
      return this.date.equals(date);
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

  matchSensor(sensor: Sensor): boolean {
    if (this.sensorIds == null) {
      return true;
    }
    if (typeof this.sensorIds === 'string') {
      return this.sensorIds === sensor.key;
    }
    return this.sensorIds.has(sensor.key);
  }

  matchRegion(region: Region): boolean {
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

  matchDate(date: Date): boolean {
    return (
      this.date == null ||
      (this.date instanceof Date ? this.date.valueOf() == date.valueOf() : this.date.includes(date))
    );
  }

  matchTimeFrame(timeFrame: TimeFrame): boolean {
    return (
      this.date == null || (this.date instanceof Date ? timeFrame.includes(this.date) : this.date.overlaps(timeFrame))
    );
  }

  matches(sensor: Sensor, region: Region | RegionLevel, date: Date | TimeFrame): boolean {
    return (
      this.matchSensor(sensor) &&
      ((typeof region === 'string' && this.matchLevel(region)) ||
        (typeof region !== 'string' && this.matchRegion(region))) &&
      ((date instanceof Date && this.matchDate(date)) || (!(date instanceof Date) && this.matchTimeFrame(date)))
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
