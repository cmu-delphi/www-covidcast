import { timeDay, timeMonth, timeWeek } from 'd3-time';
import { addNameInfos, formatAPITime, addMissing, fitRange, parseAPITime, EpiDataRow } from '../data';
import { nationInfo } from '../data/regions';
import { currentDate, currentSensor, sensorList, selectByInfo, IStatsInfo } from '.';
import { determineTrend, Trend } from './trend';
import { determineMinMax, determineStats } from './stats';
import { formatValue } from '../formats';
import { scaleSequential } from 'd3-scale';
import { scrollToTop } from '../util';
import type { RegionInfo, RegionInfo as Region, RegionLevel, RegionArea, CountyInfo } from '../data/regions';
import { Sensor, SensorEntry, yesterdayDate } from './constants';
import { get, Writable } from 'svelte/store';
import { TimeFrame } from '../data/TimeFrame';
// import { callTrendAPI, GeoPair, SourceSignalPair } from '../data/api';
import fetchTriple from '../data/fetchTriple';
import { toTimeValue } from '../data/utils';

export { TimeFrame } from '../data/TimeFrame';

export type { Sensor } from './constants';
export type { RegionInfo as Region, RegionLevel } from '../data/regions';

export const WINDOW_SIZE = 4; // months;
export const SPARKLINE_SIZE = 4; // weeks;

export const ALL_TIME_FRAME = new TimeFrame(parseAPITime('20200101'), yesterdayDate);

export interface RegionEpiDataRow extends EpiDataRow, Region {}

export class DataFetcher {
  private readonly cache = new Map<
    string,
    Promise<RegionEpiDataRow[]> | Promise<EpiDataRow & RegionInfo> | Promise<Trend>
  >();
  private primarySensorKey = '';
  private primaryRegionId = '';
  private primaryTimeValue = 0;
  private primaryWindowRange = '';

  toDateKey(sensor: Sensor, region: { id: string; level: string }, date: DateParam, suffix = ''): string {
    const s = this.primarySensorKey === sensor.key ? 'SENSOR' : sensor.key;
    const r =
      this.primaryRegionId === region.id && region.level !== 'nation' ? 'REGION' : `${region.level}-${region.id}`;
    const d = this.primaryTimeValue === date.timeValue ? 'DATE' : date.timeValue;
    return `${s}@${r}@${d}${suffix ? '@' : ''}${suffix}`;
  }

  toWindowKey(sensor: Sensor, region: { id: string; level: string }, timeFrame: TimeFrame, suffix = ''): string {
    const s = this.primarySensorKey === sensor.key ? 'SENSOR' : sensor.key;
    const r =
      this.primaryRegionId === region.id && region.level !== 'nation' ? 'REGION' : `${region.level}-${region.id}`;
    const d = this.primaryWindowRange === timeFrame.range ? 'WINDOW' : timeFrame.range;
    return `${s}@${r}@${d}${suffix ? '@' : ''}${suffix}`;
  }

  invalidate(sensor: SensorParam, region: RegionParam, date: DateParam): void {
    const hasSensorChanged = this.primarySensorKey !== sensor.key;
    this.primarySensorKey = sensor.key;
    const hasRegionChanged = this.primaryRegionId !== region.id;
    this.primaryRegionId = region.id;
    const hasDateChanged = this.primaryTimeValue !== date.timeValue;
    this.primaryTimeValue = date.timeValue;
    const hasWindowChanged = this.primaryWindowRange !== date.windowTimeFrame.range;
    this.primaryWindowRange = date.windowTimeFrame.range;
    if (!hasSensorChanged && !hasRegionChanged && !hasDateChanged && !hasWindowChanged) {
      return; // no invalidation needed
    }
    Array.from(this.cache.keys()).forEach((key) => {
      const parts = key.split('@');
      if (
        (hasSensorChanged && parts[0] === 'SENSOR') ||
        (hasRegionChanged && parts[1] === 'REGION') ||
        (hasDateChanged && parts[2] === 'DATE') ||
        (hasWindowChanged && parts[2] === 'WINDOW')
      ) {
        // invalid now
        this.cache.delete(key);
        return;
      }
    });
  }
  /**
   * @param {Sensor|SensorParam} sensor
   * @param {string} level
   * @param {string} geo
   * @param {Date | DateParam} date
   * @returns {Promise<EpiDataRow[]>}
   */
  fetch1SensorNRegions1Date(
    sensor: Sensor | SensorParam,
    regions: RegionLevel | Region[],
    date: Date | DateParam,
  ): Promise<RegionEpiDataRow[]> {
    const lSensor = SensorParam.unbox(sensor);
    const lDate = DateParam.box(date);
    const geoKey = {
      level: typeof regions === 'string' ? regions : regions[0].level,
      id: typeof regions == 'string' ? '*' : regions.map((d) => d.propertyId).join(','),
    };
    const key = this.toDateKey(lSensor, geoKey, lDate);
    if (this.cache.has(key)) {
      return this.cache.get(key) as Promise<RegionEpiDataRow[]>;
    }
    const r = fetchTriple(lSensor, regions, lDate.value).then(addNameInfos);
    this.cache.set(key, r);
    return r;
  }

  fetch1Sensor1RegionNDates(
    sensor: Sensor | SensorParam,
    region: Region | RegionParam,
    timeFrame: TimeFrame,
  ): Promise<RegionEpiDataRow[]> {
    const lSensor = SensorParam.unbox(sensor);
    const lRegion = RegionParam.unbox(region);
    const key = this.toWindowKey(lSensor, lRegion, timeFrame);
    if (this.cache.has(key)) {
      return this.cache.get(key) as Promise<RegionEpiDataRow[]>;
    }

    const r = fetchTriple(lSensor, lRegion, timeFrame)
      .then(addNameInfos)
      .then((rows) => addMissing(rows, lSensor));
    this.cache.set(key, r);
    return r;
  }

  fetchNSensor1RegionNDates(
    sensors: readonly (Sensor | SensorParam)[],
    region: Region | RegionParam,
    timeFrame: TimeFrame,
  ): Promise<RegionEpiDataRow[]>[] {
    const lSensors = sensors.map((sensor) => SensorParam.unbox(sensor));
    const lRegion = RegionParam.unbox(region);

    const missingSensors = lSensors.filter((d) => !this.cache.has(this.toWindowKey(d, lRegion, timeFrame)));

    if (missingSensors.length > 0) {
      const data = fetchTriple(missingSensors, lRegion, timeFrame).then(addNameInfos);

      for (const sensor of missingSensors) {
        const sensorData = data
          .then((rows) => rows.filter((d) => d.signal === sensor.signal && d.source === sensor.id))
          .then((rows) => addMissing(rows, sensor));
        this.cache.set(this.toWindowKey(sensor, lRegion, timeFrame), sensorData);
      }
    }

    // use cached version
    return lSensors.map((sensor) => this.fetch1Sensor1RegionNDates(sensor, lRegion, timeFrame));
  }

  fetchNSensorNRegionNDates(
    sensors: readonly (Sensor | SensorParam)[],
    regions: readonly Region[],
    timeFrame: TimeFrame,
  ): Promise<RegionEpiDataRow[]>[] {
    if (regions.length === 0) {
      return [];
    }
    const lSensors = sensors.map((sensor) => SensorParam.unbox(sensor));
    const geoKey = {
      level: regions[0].level,
      id: regions.map((d) => d.propertyId).join(','),
    };
    const missingSensors = lSensors.filter((sensor) => !this.cache.has(this.toWindowKey(sensor, geoKey, timeFrame)));
    if (missingSensors.length > 0) {
      const data = fetchTriple(missingSensors, regions, timeFrame).then(addNameInfos);

      for (const sensor of missingSensors) {
        const sensorData = data.then((rows) =>
          rows.filter((d) => d.signal === sensor.signal && d.source === sensor.id),
        );
        this.cache.set(this.toWindowKey(sensor, geoKey, timeFrame), sensorData);
      }
    }

    // use cached version
    return lSensors.map((sensor) => this.fetch1SensorNRegionsNDates(sensor, regions, timeFrame));
  }

  fetch1SensorNRegionsNDates(
    sensor: Sensor | SensorParam,
    regions: readonly Region[] | RegionLevel,
    timeFrame: TimeFrame,
  ): Promise<RegionEpiDataRow[]> {
    if (regions.length === 0) {
      return Promise.resolve([] as RegionEpiDataRow[]);
    }
    const lSensor = SensorParam.unbox(sensor);
    const level = typeof regions === 'string' ? regions : regions[0].level;
    const geo = typeof regions === 'string' ? '*' : regions.map((d) => d.propertyId).join(',');
    const key = this.toWindowKey(lSensor, { level, id: geo }, timeFrame);
    if (this.cache.has(key)) {
      return this.cache.get(key) as Promise<RegionEpiDataRow[]>;
    }

    const r = fetchTriple(lSensor, regions, timeFrame).then(addNameInfos);
    // no missing
    this.cache.set(key, r);
    return r;
  }

  fetchSparkLine(
    sensor: Sensor | SensorParam,
    region: Region | RegionParam,
    date: DateParam,
  ): Promise<RegionEpiDataRow[]> {
    const lSensor = SensorParam.unbox(sensor);
    const lRegion = RegionParam.unbox(region);
    const key = this.toWindowKey(lSensor, lRegion, date.windowTimeFrame, 'sparkline');
    if (this.cache.has(key)) {
      return this.cache.get(key) as Promise<RegionEpiDataRow[]>;
    }
    // TODO just load sparkline
    const rows = this.fetch1Sensor1RegionNDates(lSensor, lRegion, date.windowTimeFrame).then((rows) =>
      rows.filter(date.sparkLineTimeFrame.filter),
    );
    this.cache.set(key, rows);
    return rows;
  }

  fetchWindowTrend(sensor: Sensor | SensorParam, region: Region | RegionParam, date: DateParam): Promise<Trend> {
    const lSensor = SensorParam.unbox(sensor);
    const lRegion = RegionParam.unbox(region);
    const lDate = date;
    const key = this.toWindowKey(lSensor, lRegion, lDate.windowTimeFrame, `${lDate.timeValue}:trend`);
    if (this.cache.has(key)) {
      return this.cache.get(key) as Promise<Trend>;
    }
    const trend = this.fetch1Sensor1RegionNDates(lSensor, lRegion, date.windowTimeFrame).then((rows) => {
      return determineTrend(date.value, rows, lSensor.highValuesAre);
    });
    // const trend = callTrendAPI(
    //   new SourceSignalPair(lSensor.id, lSensor.signal),
    //   new GeoPair(lRegion.level, lRegion.propertyId),
    //   lDate.value,
    //   lDate.windowTimeFrame,
    // ).then((rows) => asTrend(rows.epidata?.[0], sensor.highValuesAre));
    this.cache.set(key, trend);
    return trend;
  }

  fetch1Sensor1Region1DateDetails(
    sensor: Sensor | SensorParam,
    region: Region | RegionParam,
    date: Date | DateParam,
  ): Promise<RegionEpiDataRow> {
    const lSensor = SensorParam.unbox(sensor);
    const lRegion = RegionParam.unbox(region);
    const lDate = DateParam.box(date);

    const key = this.toDateKey(lSensor, lRegion, lDate, 'details');
    if (this.cache.has(key)) {
      return this.cache.get(key) as Promise<RegionEpiDataRow>;
    }
    const r = fetchTriple(lSensor, lRegion, lDate.value, { advanced: true })
      .then(addNameInfos)
      .then((rows) => rows[0]);
    this.cache.set(key, r);
    return r;
  }

  fetchNSensor1Region1DateDetails(
    sensors: readonly (Sensor | SensorParam)[],
    region: Region | RegionParam,
    date: Date | DateParam,
  ): Promise<RegionEpiDataRow>[] {
    const lSensors = sensors.map((sensor) => SensorParam.unbox(sensor));
    const lRegion = RegionParam.unbox(region);
    const lDate = DateParam.box(date);

    const missingSensors = lSensors.filter(
      (sensor) => !this.cache.has(this.toDateKey(sensor, lRegion, lDate, 'details')),
    );

    if (missingSensors.length > 0) {
      const data = fetchTriple(missingSensors, lRegion, lDate.value, { advanced: true }).then(addNameInfos);
      for (const sensor of missingSensors) {
        const sensorData = data.then((rows) => rows.find((d) => d.signal === sensor.signal && d.source === sensor.id)!);

        this.cache.set(this.toDateKey(sensor, lRegion, lDate, 'details'), sensorData);
      }
    }
    // use cached version
    return lSensors.map((sensor) => this.fetch1Sensor1Region1DateDetails(sensor, lRegion, lDate));
  }
}

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

export class DateParam {
  readonly timeValue: number;
  readonly value: Date;
  readonly allTimeFrame: TimeFrame;
  readonly sensorTimeFrame: TimeFrame;
  readonly sparkLineTimeFrame: TimeFrame;
  readonly windowTimeFrame: TimeFrame;

  constructor(date: Date, sensor?: Sensor | TimeFrame, timeLookup?: Map<string, [number, number]>) {
    this.timeValue = toTimeValue(date);
    this.value = date;
    this.allTimeFrame = ALL_TIME_FRAME;
    this.sensorTimeFrame = resolveSensorTimeFrame(sensor, timeLookup);
    this.sparkLineTimeFrame = TimeFrame.compute(
      date,
      (d, step) => timeWeek.offset(d, step),
      SPARKLINE_SIZE,
      this.sensorTimeFrame.max,
    );
    this.windowTimeFrame = TimeFrame.compute(
      date,
      (d, step) => timeMonth.offset(d, step),
      WINDOW_SIZE,
      this.sensorTimeFrame.max,
    );
  }

  shift(days: number): DateParam {
    const shifted = timeDay.offset(this.value, days);
    return new DateParam(shifted, this.sensorTimeFrame);
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
  readonly isCasesOrDeath: boolean;
  readonly dataSourceName: string;

  readonly factor: number;
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

  constructor(sensor: Sensor, store = currentSensor, timeLookup?: Map<string, [number, number]>) {
    this.writeAbleStore = store;
    this.key = sensor.key;
    this.name = sensor.name;
    this.description = resolveDescription(sensor);
    this.signalTooltip = sensor.signalTooltip;
    this.value = sensor;
    this.rawValue = sensor.rawSensor;
    this.isCasesOrDeath = (sensor as SensorEntry).isCasesOrDeath || false;
    this.dataSourceName = sensor.dataSourceName;
    // fractions as percentages here
    this.factor = sensor.format === 'fraction' ? 100 : 1;
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

    this.timeFrame = resolveSensorTimeFrame(sensor, timeLookup);
  }

  set(sensor: Sensor, scrollTop = false): void {
    if (sensor) {
      this.writeAbleStore.set(sensor.key);
    }
    if (scrollTop) {
      scrollToTop();
    }
  }

  domain(stats: Map<string, IStatsInfo>, level: RegionLevel): [number, number] {
    const domain = determineMinMax(stats, this.value, level, {}, false);
    const scaled: [number, number] = [domain[0] * this.factor, domain[1] * this.factor];
    if (this.isPercentage) {
      scaled[0] = Math.max(0, scaled[0]);
      scaled[1] = Math.min(100, scaled[1]);
    } else if (this.isPer100K) {
      scaled[0] = Math.max(0, scaled[0]);
      scaled[1] = Math.min(100000, scaled[1]);
    }
    return scaled;
  }

  stats(stats: Map<string, IStatsInfo>, level: RegionLevel): { max: number; mean: number; std: number } {
    return determineStats(stats, this.value, level, {});
  }

  createColorScale(stats: Map<string, IStatsInfo>, level: RegionLevel): (v: number) => string {
    const domain = this.domain(stats, level);
    return scaleSequential(this.value.colorScale).domain(domain);
  }

  static box(sensor: Sensor | SensorParam): SensorParam {
    if (sensor instanceof SensorParam) {
      return sensor;
    }
    return new SensorParam(sensor);
  }

  static unbox(sensor: Sensor | SensorParam): Sensor {
    if (sensor instanceof SensorParam) {
      return sensor.value;
    }
    return sensor;
  }
}

export const CASES = new SensorParam(sensorList.find((d) => d.isCasesOrDeath && d.name.includes('Cases'))!);
export const DEATHS = new SensorParam(sensorList.find((d) => d.isCasesOrDeath && d.name.includes('Deaths'))!);

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
