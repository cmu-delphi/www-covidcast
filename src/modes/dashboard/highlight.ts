import { formatDateISO } from '../../formats';
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

function equalIds<T>(a: Set<T> | null, b: Set<T> | null): boolean {
  if (a === b) {
    return true;
  }
  if ((a == null) !== (b == null)) {
    return false;
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

export class WidgetHighlight {
  private readonly sensorIds: Set<string> | null;
  private readonly regionIds: Set<string> | null;

  constructor(
    sensor: null | Sensor | readonly Sensor[],
    region: null | Region | readonly Region[] | RegionLevel,
    public readonly date: null | Date | TimeFrame,
  ) {
    if (sensor) {
      this.sensorIds = new Set();
      if (isArray(sensor)) {
        for (const s of sensor) {
          this.sensorIds.add(s.key);
        }
      } else {
        this.sensorIds.add(sensor.key);
      }
    } else {
      this.sensorIds = null;
    }
    if (typeof region === 'string') {
      this.regionIds = new Set();
      this.regionIds.add(levelKey(region));
    } else if (region) {
      this.regionIds = new Set();
      if (isArray(region)) {
        for (const r of region) {
          this.regionIds.add(regionKey(r));
        }
      } else {
        this.regionIds.add(regionKey(region));
      }
    } else {
      this.regionIds = null;
    }
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
    return this.sensorIds == null || this.sensorIds.has(sensor.key);
  }

  matchRegion(region: Region): boolean {
    return (
      this.regionIds == null || this.regionIds.has(regionKey(region)) || this.regionIds.has(levelKey(region.level))
    );
  }

  matchLevel(level: RegionLevel): boolean {
    return (
      this.regionIds === null ||
      this.regionIds.has(levelKey(level)) ||
      [...this.regionIds].some((d) => d.endsWith(`@${level}`))
    );
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
    const sensor = this.sensorIds == null ? '*' : [...this.sensorIds].join(',');
    const region = this.regionIds == null ? '*' : [...this.regionIds].join(',');
    const date = this.date == null ? '*' : this.date instanceof Date ? formatDateISO(this.date) : this.date.toString();
    return `(sensor=${sensor}, region=${region}, date=${date})`;
  }

  [Symbol.toStringTag](): string {
    return this.toString();
  }
}
