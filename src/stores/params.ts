import { timeDay, timeMonth, timeWeek } from 'd3-time';
import { addNameInfos, fetchData, formatAPITime, addMissing, fitRange, parseAPITime, EpiDataRow } from '../data';
import { nationInfo } from '../maps/infos';
import { currentDate, yesterdayDate, currentSensor, sensorList, selectByInfo } from '.';
import { determineTrend, Trend } from './trend';
import { determineMinMax } from './stats';
import { formatValue } from '../formats';
import { scaleSequential } from 'd3-scale';
import { scrollToTop } from '../util';
import type { RegionInfo, RegionInfo as Region, RegionLevel, RegionArea, CountyInfo } from '../maps/interfaces';
import type { Sensor, SensorEntry } from './constants';
import type { Writable } from 'svelte/store';

export type { Sensor } from './constants';
export type { RegionInfo as Region, RegionLevel } from '../maps/interfaces';

export const WINDOW_SIZE = 4; // months;
export const SPARKLINE_SIZE = 4; // weeks;

export function toTimeValue(date: Date): number {
  return Number.parseInt(formatAPITime(date), 10);
}

export interface RegionEpiDataRow extends EpiDataRow, Region {}

export class TimeFrame {
  readonly min: Date;
  readonly max: Date;
  readonly difference: number;
  readonly range: string;
  readonly domain: [number, number];
  readonly filter: (row: EpiDataRow) => boolean;

  constructor(min: Date, max: Date) {
    this.min = min;
    this.max = max;
    this.difference = timeDay.count(min, max);
    this.range = `${formatAPITime(min)}-${formatAPITime(max)}`;
    this.domain = [min.getTime(), max.getTime()];
    /**
     * @param {EpiDataRow} row
     */
    this.filter = (row) => {
      return row.date_value >= this.min && row.date_value <= this.max;
    };
  }

  equals(that: TimeFrame): boolean {
    return this.range === that.range;
  }

  includes(date: Date): boolean {
    return date >= this.min && date <= this.max;
  }

  overlaps(timeFrame: TimeFrame): boolean {
    // not outside of the range, so at least a partial overlap
    return !(timeFrame.max < this.min || timeFrame.min > this.max);
  }

  toString(): string {
    return this.range;
  }

  static compute(
    date: Date,
    offset: (date: Date, step: number) => Date,
    offsetFactor: number,
    maxDate = yesterdayDate,
  ): TimeFrame {
    let max = offset(date, offsetFactor / 2);
    if (max > maxDate) {
      max = maxDate;
    }
    const min = offset(max, -offsetFactor);
    return new TimeFrame(min, max);
  }

  shift(minShiftInDays = 0, maxShiftInDays = 0): TimeFrame {
    return new TimeFrame(timeDay.offset(this.min, minShiftInDays), timeDay.offset(this.max, maxShiftInDays));
  }
}

const ALL_TIME_FRAME = new TimeFrame(parseAPITime('20200101'), yesterdayDate);

const MAX_DATA_ROWS = 3650;

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
    level: RegionLevel,
    geo: string,
    date: Date | DateParam,
  ): Promise<RegionEpiDataRow[]> {
    sensor = sensor instanceof SensorParam ? sensor.value : sensor;
    date = date instanceof DateParam ? date : new DateParam(date);

    const key = this.toDateKey(sensor, { id: geo, level }, date);
    if (this.cache.has(key)) {
      return this.cache.get(key) as Promise<RegionEpiDataRow[]>;
    }
    const r = fetchData(
      sensor,
      level,
      geo,
      date.value,
      {
        time_value: date.timeValue,
      },
      {
        multiValues: false,
        factor: sensor.format === 'fraction' ? 100 : 1,
      },
    ).then(addNameInfos);
    this.cache.set(key, r);
    return r;
  }

  fetch1Sensor1RegionNDates(
    sensor: Sensor | SensorParam,
    region: Region | RegionParam,
    timeFrame: TimeFrame,
  ): Promise<RegionEpiDataRow[]> {
    const lSensor = sensor instanceof SensorParam ? sensor.value : sensor;
    const lRegion = region instanceof RegionParam ? region.value : region;
    const key = this.toWindowKey(lSensor, lRegion, timeFrame);
    if (this.cache.has(key)) {
      return this.cache.get(key) as Promise<RegionEpiDataRow[]>;
    }
    // if (
    //   timeFrame.range !== ALL_TIME_FRAME.range &&
    //   region.id === this.primaryRegionId &&
    //   sensor.key === this.primarySensorKey
    // ) {
    //   // fetch all history for the primary one
    //   const rows = this.fetch1Sensor1RegionNDates(sensor, region, ALL_TIME_FRAME);
    //   const r = rows.then((rows) => rows.filter(timeFrame.filter));
    //   this.cache.set(key, r);
    //   return r;
    // }
    const r = fetchData(
      lSensor,
      lRegion.level,
      lRegion.propertyId,
      timeFrame.range,
      {
        geo_value: lRegion.propertyId,
      },
      {
        multiValues: false,
        factor: lSensor.format === 'fraction' ? 100 : 1,
      },
    )
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
    const lSensors = sensors.map((sensor) => (sensor instanceof SensorParam ? sensor.value : sensor));
    const lRegion = region instanceof RegionParam ? region.value : region;

    const missingDataSensors = lSensors.filter(
      (sensor) => !this.cache.has(this.toWindowKey(sensor, lRegion, timeFrame)),
    );
    // we can only fetch the same data source for now
    const dataSources = new Set(missingDataSensors.map((d) => d.id));

    if (dataSources.size === 1 && timeFrame.range !== ALL_TIME_FRAME.range) {
      // fill up the cache
      const expectedDays = timeFrame.difference;
      const batchSize = Math.floor(MAX_DATA_ROWS / expectedDays);
      // console.log(batchSize);
      for (let i = 0; i < missingDataSensors.length; i += batchSize) {
        const slice = missingDataSensors.slice(i, Math.min(missingDataSensors.length, i + batchSize));
        const sliceSensor = {
          ...missingDataSensors[0],
          signal: slice.map((d) => d.signal).join(','),
        };
        const data = fetchData(
          sliceSensor,
          lRegion.level,
          lRegion.propertyId,
          timeFrame.range,
          {},
          {
            multiValues: false,
            transferSignal: true,
            factor: sliceSensor.format === 'fraction' ? 100 : 1,
          },
        ).then(addNameInfos);
        for (const s of slice) {
          // compute slice per sensor and fill the cache
          const sensorData = data
            .then((rows) => rows.filter((d) => d.signal === s.signal))
            .then((rows) => addMissing(rows, s));
          this.cache.set(this.toWindowKey(s, lRegion, timeFrame), sensorData);
        }
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
    const lSensors = sensors.map((sensor) => (sensor instanceof SensorParam ? sensor.value : sensor));
    const level = regions[0].level;
    const geo = regions.map((d) => d.propertyId).join(',');

    const missingDataSensors = lSensors.filter(
      (sensor) => !this.cache.has(this.toWindowKey(sensor, { level, id: geo }, timeFrame)),
    );
    // we can only fetch the same data source for now
    const dataSources = new Set(missingDataSensors.map((d) => d.id));

    if (dataSources.size === 1 && timeFrame.range !== ALL_TIME_FRAME.range) {
      const expectedDays = timeFrame.difference;
      const batchSize = Math.floor(MAX_DATA_ROWS / expectedDays);
      const sensorBatchSize = Math.floor(batchSize / regions.length);
      const regionBatchSize = Math.floor(batchSize / missingDataSensors.length);
      if (regionBatchSize > sensorBatchSize) {
        // slice by region and fetch all sensors at once
        const data: Promise<EpiDataRow[]>[] = [];
        const sliceSensor = {
          ...missingDataSensors[0],
          signal: missingDataSensors.map((d) => d.signal).join(','),
        };
        for (let i = 0; i < regions.length; i += regionBatchSize) {
          const slice = regions.slice(i, Math.min(regions.length, i + regionBatchSize));
          data.push(
            fetchData(
              sliceSensor,
              level,
              slice.map((d) => d.propertyId).join(','),
              timeFrame.range,
              {},
              {
                multiValues: false,
                factor: sliceSensor.format === 'fraction' ? 100 : 1,
                transferSignal: true,
              },
            ),
          );
        }
        const r = Promise.all(data)
          .then((rows) => ([] as EpiDataRow[]).concat(...rows))
          .then(addNameInfos);
        // fetch all and then split by sensor
        for (const s of missingDataSensors) {
          // compute slice per sensor and fill the cache
          const sensorData = r.then((rows) => rows.filter((d) => d.signal === s.signal));
          this.cache.set(this.toWindowKey(s, { level, id: geo }, timeFrame), sensorData);
        }
      } else {
        // slice by sensor and fetch all regions at once
        for (let i = 0; i < missingDataSensors.length; i += sensorBatchSize) {
          const slice = missingDataSensors.slice(i, Math.min(missingDataSensors.length, i + sensorBatchSize));
          const sliceSensor = {
            ...missingDataSensors[0],
            signal: slice.map((d) => d.signal).join(','),
          };
          const data = fetchData(
            sliceSensor,
            level,
            geo,
            timeFrame.range,
            {},
            {
              multiValues: false,
              transferSignal: true,
              factor: sliceSensor.format === 'fraction' ? 100 : 1,
            },
          ).then(addNameInfos);
          for (const s of slice) {
            // compute slice per sensor and fill the cache
            const sensorData = data
              .then((rows) => rows.filter((d) => d.signal === s.signal))
              .then((rows) => addMissing(rows, s));
            this.cache.set(this.toWindowKey(s, { level, id: geo }, timeFrame), sensorData);
          }
        }
      }
    }

    // use cached version
    return lSensors.map((sensor) => this.fetch1SensorNRegionsNDates(sensor, regions, timeFrame));
  }

  /**
   * @param isAll whether it should load all regions (used for performance)
   */
  fetch1SensorNRegionsNDates(
    sensor: Sensor | SensorParam,
    regions: readonly Region[],
    timeFrame: TimeFrame,
    isAll = false,
  ): Promise<RegionEpiDataRow[]> {
    if (regions.length === 0) {
      return Promise.resolve([] as RegionEpiDataRow[]);
    }
    const lSensor = sensor instanceof SensorParam ? sensor.value : sensor;
    const level = regions[0].level;
    const geo = regions.map((d) => d.propertyId).join(',');
    const key = this.toWindowKey(lSensor, { level, id: geo }, timeFrame);
    if (this.cache.has(key)) {
      return this.cache.get(key) as Promise<RegionEpiDataRow[]>;
    }
    const expectedDays = timeFrame.difference;

    const batchSize = Math.floor(MAX_DATA_ROWS / expectedDays);

    if (batchSize >= regions.length) {
      const r = fetchData(
        lSensor,
        level,
        isAll ? '*' : regions.map((d) => d.propertyId).join(','),
        timeFrame.range,
        {},
        {
          multiValues: false,
          factor: lSensor.format === 'fraction' ? 100 : 1,
        },
      ).then(addNameInfos);
      // no missing
      this.cache.set(key, r);
      return r;
    }

    // load in batches
    // console.log(batchSize);
    const data = [];
    for (let i = 0; i < regions.length; i += batchSize) {
      const slice = regions.slice(i, Math.min(regions.length, i + batchSize));
      data.push(
        fetchData(
          lSensor,
          level,
          slice.map((d) => d.propertyId).join(','),
          timeFrame.range,
          {},
          {
            multiValues: false,
            factor: lSensor.format === 'fraction' ? 100 : 1,
          },
        ),
      );
    }
    const r = Promise.all(data)
      .then((rows) => ([] as EpiDataRow[]).concat(...rows))
      .then(addNameInfos);

    // no missing
    this.cache.set(key, r);
    return r;
  }

  fetchSparkLine(
    sensor: Sensor | SensorParam,
    region: Region | RegionParam,
    date: DateParam,
  ): Promise<RegionEpiDataRow[]> {
    const lSensor = sensor instanceof SensorParam ? sensor.value : sensor;
    const lRegion = region instanceof RegionParam ? region.value : region;
    const key = this.toWindowKey(lSensor, lRegion, date.windowTimeFrame, 'sparkline');
    if (this.cache.has(key)) {
      return this.cache.get(key) as Promise<RegionEpiDataRow[]>;
    }
    const rows = this.fetch1Sensor1RegionNDates(lSensor, lRegion, date.windowTimeFrame).then((rows) =>
      rows.filter(date.sparkLineTimeFrame.filter),
    );
    this.cache.set(key, rows);
    return rows;
  }

  fetchWindowTrend(sensor: Sensor | SensorParam, region: Region | RegionParam, date: DateParam): Promise<Trend> {
    const lSensor = sensor instanceof SensorParam ? sensor.value : sensor;
    const lRegion = region instanceof RegionParam ? region.value : region;
    const lDate = date instanceof DateParam ? date : new DateParam(date);
    const key = this.toWindowKey(lSensor, lRegion, lDate.windowTimeFrame, `${lDate.timeValue}:trend`);
    if (this.cache.has(key)) {
      return this.cache.get(key) as Promise<Trend>;
    }
    const trend = this.fetch1Sensor1RegionNDates(sensor, region, date.windowTimeFrame).then((rows) =>
      determineTrend(date.value, rows, sensor.isInverted),
    );
    this.cache.set(key, trend);
    return trend;
  }

  fetch1Sensor1Region1DateDetails(
    sensor: Sensor | SensorParam,
    region: Region | RegionParam,
    date: Date | DateParam,
  ): Promise<RegionEpiDataRow> {
    const lSensor = sensor instanceof SensorParam ? sensor.value : sensor;
    const lRegion = region instanceof RegionParam ? region.value : region;
    const lDate = date instanceof DateParam ? date : new DateParam(date);

    const key = this.toDateKey(lSensor, lRegion, lDate, 'details');
    if (this.cache.has(key)) {
      return this.cache.get(key) as Promise<RegionEpiDataRow>;
    }
    const r = fetchData(
      lSensor,
      lRegion.level,
      lRegion.propertyId,
      lDate.value,
      {
        time_value: lDate.timeValue,
      },
      {
        multiValues: false,
        advanced: true,
        factor: lSensor.format === 'fraction' ? 100 : 1,
      },
    )
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
    const lSensors = sensors.map((sensor) => (sensor instanceof SensorParam ? sensor.value : sensor));
    const lRegion = region instanceof RegionParam ? region.value : region;
    const lDate = date instanceof DateParam ? date : new DateParam(date);

    const missingDataSensors = lSensors.filter(
      (sensor) => !this.cache.has(this.toDateKey(sensor, lRegion, lDate, 'details')),
    );
    // we can only fetch the same data source for now
    const dataSources = new Set(missingDataSensors.map((d) => d.id));

    if (dataSources.size === 1) {
      // fill up the cache
      const sliceSensor = {
        ...missingDataSensors[0],
        signal: missingDataSensors.map((d) => d.signal).join(','),
      };
      const data = fetchData(
        sliceSensor,
        lRegion.level,
        lRegion.propertyId,
        lDate.value,
        {},
        {
          multiValues: false,
          advanced: true,
          transferSignal: true,
          factor: sliceSensor.format === 'fraction' ? 100 : 1,
        },
      ).then(addNameInfos);
      for (const s of missingDataSensors) {
        // compute slice per sensor and fill the cache
        const sensorData = data.then((rows) => rows.find((d) => d.signal === s.signal)!);
        this.cache.set(this.toDateKey(s, lRegion, lDate, 'details'), sensorData);
      }
    }

    // use cached version
    return lSensors.map((sensor) => this.fetch1Sensor1Region1DateDetails(sensor, lRegion, lDate));
  }

  // /**
  //  * @param {Sensor|SensorParam} sensor
  //  * @param {Region|RegionParam} region
  //  * @param {Date | DateParam} date
  //  * @return {Promise<Trend>}
  //  */
  // fetchGlobalTrend(sensor, region, date) {
  //   sensor = sensor instanceof SensorParam ? sensor.value : sensor;
  //   region = region instanceof RegionParam ? region.value : region;
  //   date = date instanceof DateParam ? date.value : date;
  //   const key = this.toWindowKey(sensor, region, ALL_TIME_FRAME, `${date.timeValue}:trend`);
  //   if (this.cache.has(key)) {
  //     return this.cache.get(key);
  //   }
  //   const trend = this.fetch1Sensor1RegionNDates(sensor, region, ALL_TIME_FRAME).then((rows) =>
  //     determineTrend(date, rows, isInverted(sensor)),
  //   );
  //   this.cache.set(key, trend);
  //   return trend;
  // }

  // /**
  //  * @param {Sensor|SensorParam} sensor
  //  * @param {Region|RegionParam} region
  //  * @return {Promise<Trend>}
  //  */
  // fetchGlobalMinMax(sensor, region) {
  //   sensor = sensor instanceof SensorParam ? sensor.value : sensor;
  //   region = region instanceof RegionParam ? region.value : region;
  //   const key = this.toWindowKey(sensor, region, ALL_TIME_FRAME, 'minmax');
  //   if (this.cache.has(key)) {
  //     return this.cache.get(key);
  //   }
  //   const trend = this.fetch1Sensor1RegionNDates(sensor, region, ALL_TIME_FRAME).then((rows) => findMinMaxRow(rows));
  //   this.cache.set(key, trend);
  //   return trend;
  // }
}

export class DateParam {
  readonly timeValue: number;
  readonly value: Date;
  readonly allTimeFrame: TimeFrame;
  readonly sensorTimeFrame: TimeFrame;
  readonly sparkLineTimeFrame: TimeFrame;
  readonly windowTimeFrame: TimeFrame;

  constructor(date: Date, sensor?: Sensor, timeLookup?: Map<string, [number, number]>) {
    this.timeValue = toTimeValue(date);
    this.value = date;
    this.allTimeFrame = ALL_TIME_FRAME;
    this.sensorTimeFrame = ALL_TIME_FRAME;
    const entry = sensor && timeLookup ? timeLookup.get(sensor.key) : null;
    if (entry) {
      this.sensorTimeFrame = new TimeFrame(parseAPITime(entry[0]), parseAPITime(entry[1]));
    }
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

  set(date: Date): void {
    currentDate.set(formatAPITime(date));
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
  readonly isInverted: boolean;
  readonly is7DayAverage: boolean;
  readonly valueUnit: string;
  readonly formatValue: (v?: number | null, enforceSign?: boolean) => string;
  readonly unit: string;
  readonly unitShort: string;
  readonly unitHTML: string;
  readonly xAxis: string;
  readonly yAxis: string;

  constructor(sensor: Sensor, store = currentSensor) {
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
    this.isInverted = sensor.isInverted;
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
  }

  set(sensor: Sensor, scrollTop = false): void {
    if (sensor) {
      this.writeAbleStore.set(sensor.key);
    }
    if (scrollTop) {
      scrollToTop();
    }
  }

  /**
   * @param {Map<string, any>} stats
   * @param {string} level
   */
  domain(stats: Map<string, { mean: number; max: number; std: number }>, level: RegionLevel): [number, number] {
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

  createColorScale(
    stats: Map<string, { mean: number; max: number; std: number }>,
    level: RegionLevel,
  ): (v: number) => string {
    const domain = this.domain(stats, level);
    return scaleSequential(this.value.colorScale).domain(domain);
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
