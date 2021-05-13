import { timeDay, timeMonth, timeWeek } from 'd3-time';
import { formatAPITime, addMissing, fitRange, parseAPITime, EpiDataRow } from '../data';
import { nationInfo } from '../data/regions';
import { currentDate, currentSensor, selectByInfo } from '.';
import { formatValue } from '../formats';
import { scaleSequential } from 'd3-scale';
import { scrollToTop } from '../util';
import type { RegionInfo as Region, RegionLevel, RegionArea, CountyInfo } from '../data/regions';
import type { Sensor, SensorEntry } from './constants';
import { get, Writable } from 'svelte/store';
import { ALL_TIME_FRAME, TimeFrame } from '../data/TimeFrame';
import { toTimeValue } from '../data/utils';
import type { MetaDataManager } from '../data/meta';

export { TimeFrame } from '../data/TimeFrame';
export type { RegionEpiDataRow } from './DataFetcher';

export type { Sensor } from './constants';
export type { RegionInfo as Region, RegionLevel } from '../data/regions';

export function resolveSensorTimeFrame(
  sensor?: Sensor | TimeFrame,
  timeLookup?: Map<string, [number, number]>,
): TimeFrame {
  if (sensor instanceof TimeFrame) {
    return sensor;
  } else {
    const entry = sensor && timeLookup ? timeLookup.get(sensor.key) : null;
    if (entry) {
      return new TimeFrame(parseAPITime(entry[0]), parseAPITime(entry[1]));
    }
  }
  return ALL_TIME_FRAME;
}

export const WINDOW_SIZE = 4; // months;
export const SPARKLINE_SIZE = 4; // weeks;

export class DateParam {
  readonly timeValue: number;
  readonly value: Date;
  readonly allTimeFrame: TimeFrame;
  readonly sparkLineTimeFrame: TimeFrame;
  readonly windowTimeFrame: TimeFrame;

  constructor(date: Date) {
    this.timeValue = toTimeValue(date);
    this.value = date;
    this.allTimeFrame = ALL_TIME_FRAME;
    this.sparkLineTimeFrame = TimeFrame.compute(date, (d, step) => timeWeek.offset(d, step), SPARKLINE_SIZE);
    this.windowTimeFrame = TimeFrame.compute(date, (d, step) => timeMonth.offset(d, step), WINDOW_SIZE);
  }

  shift(days: number): DateParam {
    const shifted = timeDay.offset(this.value, days);
    return new DateParam(shifted);
  }

  set(date: Date): void {
    const d = formatAPITime(date);
    if (get(currentDate) !== d) {
      currentDate.set(d);
    }
  }

  static box(date: Date | DateParam): DateParam {
    if (date instanceof DateParam) {
      return date;
    }
    return new DateParam(date);
  }
  static unbox(date: Date | DateParam): Date;
  static unbox(date: Date | TimeFrame | DateParam): Date | TimeFrame;
  static unbox(date: Date | TimeFrame | DateParam): Date | TimeFrame {
    if (date instanceof DateParam) {
      return date.value;
    }
    return date;
  }
}

function resolveDescription(sensor: Sensor) {
  const s = sensor as SensorEntry;
  if (s.mapTitleText == null) {
    return s.description ?? '';
  }
  if (typeof s.mapTitleText === 'function') {
    return s.mapTitleText();
  }
  return s.mapTitleText;
}

export class SensorParam {
  private readonly writeAbleStore: Writable<string>;

  readonly key: string;
  readonly name: string;
  readonly description: string;
  readonly signalTooltip: string;
  readonly value: Sensor;
  readonly rawValue?: Sensor;
  readonly rawCumulativeValue?: Sensor;

  readonly isCasesOrDeath: boolean;
  readonly dataSourceName: string;

  readonly isPercentage: boolean;
  readonly isPer100K: boolean;
  readonly highValuesAre: Sensor['highValuesAre'];
  readonly is7DayAverage: boolean;
  readonly valueUnit: string;
  readonly formatValue: (v?: number | null, enforceSign?: boolean) => string;
  readonly unit: string;
  readonly unitShort: string;
  readonly unitHTML: string;
  readonly xAxis: string;
  readonly yAxis: string;

  readonly timeFrame: TimeFrame;
  readonly manager: MetaDataManager;

  constructor(sensor: Sensor, metaDataManager: MetaDataManager, store = currentSensor) {
    this.writeAbleStore = store;
    this.manager = metaDataManager;
    this.key = sensor.key;
    this.name = sensor.name;
    this.description = resolveDescription(sensor);
    this.signalTooltip = sensor.signalTooltip;
    this.value = sensor;
    this.rawValue = sensor.rawSensor;
    this.rawCumulativeValue = sensor.rawCumulativeSensor;

    this.isCasesOrDeath = (sensor as SensorEntry).isCasesOrDeath || false;
    this.dataSourceName = sensor.dataSourceName;
    this.isPercentage = sensor.format == 'percent' || sensor.format === 'fraction';
    this.isPer100K = sensor.format === 'per100k';
    this.highValuesAre = sensor.highValuesAre;
    this.is7DayAverage = sensor.is7DayAverage;
    this.valueUnit = this.is7DayAverage ? '7-day average' : 'value';
    this.formatValue = formatValue;
    this.unit = sensor.unit;
    this.unitShort = this.isPer100K ? 'per 100k' : this.isPercentage ? 'per 100' : this.unit;
    this.unitHTML = this.isPer100K
      ? `<span class="per100k"><span>PER</span><span>100K</span></span>`
      : this.isPercentage
      ? `<span class="per100">/100</span>`
      : '';
    this.xAxis = sensor.xAxis;
    this.yAxis = sensor.yAxis;

    this.timeFrame = metaDataManager.getTimeFrame(sensor);
  }

  set(sensor: Sensor, scrollTop = false): void {
    if (sensor) {
      this.writeAbleStore.set(sensor.key);
    }
    if (scrollTop) {
      scrollToTop();
    }
  }

  domain(level: RegionLevel = 'county'): [number, number] {
    const domain = this.manager.getValueDomain(this.value, level);
    const scaled: [number, number] = [domain[0] * this.value.valueScaleFactor, domain[1] * this.value.valueScaleFactor];
    if (this.isPercentage) {
      scaled[0] = Math.max(0, scaled[0]);
      scaled[1] = Math.min(100, scaled[1]);
    } else if (this.isPer100K) {
      scaled[0] = Math.max(0, scaled[0]);
      scaled[1] = Math.min(100000, scaled[1]);
    }
    return scaled;
  }

  createColorScale(level: RegionLevel = 'county'): (v: number) => string {
    const domain = this.domain(level);
    return scaleSequential(this.value.colorScale).domain(domain);
  }

  static unbox(sensor: Sensor | SensorParam): Sensor {
    if (sensor instanceof SensorParam) {
      return sensor.value;
    }
    return sensor;
  }
}

export class RegionParam implements Region {
  readonly value: Region;

  readonly name: string;
  readonly displayName: string;
  readonly id: string;
  readonly propertyId: string; // geojson: feature.property.id
  readonly population?: number;
  readonly region?: RegionArea; // just for state and county
  readonly state?: string; // just for county
  readonly level: RegionLevel;

  constructor(region?: Region) {
    this.value = region ?? nationInfo;
    this.name = this.value.name;
    this.id = this.value.id;
    this.displayName = this.value.displayName;
    this.level = this.value.level;
    this.propertyId = this.value.propertyId;
    this.region = (this.value as CountyInfo).region;
    this.state = (this.value as CountyInfo).state;
  }

  set(region: Region, scrollTop = false): void {
    selectByInfo(region);
    if (scrollTop) {
      scrollToTop();
    }
  }

  static box(region: Region | RegionParam): RegionParam {
    if (region instanceof RegionParam) {
      return region;
    }
    return new RegionParam(region);
  }

  static unbox(region: Region | RegionParam): Region {
    if (region instanceof RegionParam) {
      return region.value;
    }
    return region;
  }
}

export function extractSparkLine<T extends EpiDataRow>(data: readonly T[], sparkLine: TimeFrame, sensor: Sensor): T[] {
  return fitRange(addMissing(data.filter(sparkLine.filter), sensor), sensor, sparkLine.min, sparkLine.max);
}

export function groupByRegion<T extends EpiDataRow & { propertyId: string }>(data: readonly T[]): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const row of data) {
    const geo = map.get(row.propertyId);
    if (geo) {
      geo.push(row);
    } else {
      map.set(row.propertyId, [row]);
    }
  }
  return map;
}
