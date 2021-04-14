import { formatDateISO } from '../../formats';
import type { Region, Sensor, TimeFrame } from '../../stores/params';

function isArray<T>(v: T | readonly T[]): v is readonly T[] {
  return Array.isArray(v);
}

function regionKey(region: Region) {
  return `${region.id}@${region.level}`;
}

export class WidgetHighlight {
  private readonly sensorIds: Set<string> | null;
  private readonly regionIds: Set<string> | null;

  constructor(
    sensor: null | Sensor | readonly Sensor[],
    region: null | Region | readonly Region[],
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
    if (region) {
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

  matchSensor(sensor: Sensor): boolean {
    return this.sensorIds == null || this.sensorIds.has(sensor.key);
  }

  matchRegion(region: Region): boolean {
    return this.regionIds == null || this.regionIds.has(regionKey(region));
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

  matches(sensor: Sensor, region: Region, date: Date | TimeFrame): boolean {
    return (
      this.matchSensor(sensor) &&
      this.matchRegion(region) &&
      ((date instanceof Date && this.matchDate(date)) || (!(date instanceof Date) && this.matchTimeFrame(date)))
    );
  }

  [Symbol.toStringTag](): string {
    const sensor = this.sensorIds == null ? '*' : [...this.sensorIds].join(',');
    const region = this.regionIds == null ? '*' : [...this.regionIds].join(',');
    const date = this.date == null ? '*' : this.date instanceof Date ? formatDateISO(this.date) : this.date.toString();
    return `(sensor=${sensor}, region=${region}, date=${date})`;
  }
}
