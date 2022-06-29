import { timeDay } from 'd3-time';
import { addMissing, addNameInfos, parseAPITime } from '../data';
import type { EpiDataRow } from '../data';
import { callTrendSeriesAPI } from '../data/api';
import { fixLevel, GeoPair, SourceSignalPair } from '../data/apimodel';
import type { EpiWeek } from '../data/EpiWeek';
import fetchTriple from '../data/fetchTriple';
import type { MetaDataManager } from '../data/meta';
import { getInfoByName, nationInfo } from '../data/regions';
import type { RegionInfo, RegionLevel } from '../data/regions';
import type { Sensor } from '../data/sensor';
import { TimeFrame } from '../data/TimeFrame';
import { asSensorTrend, fetchTrendR, fetchTrendS, fetchTrendSR } from '../data/trend';
import type { SensorTrend } from '../data/trend';
import { DateParam, groupByRegion, RegionParam, SensorParam } from './params';
import type { Region } from './params';

export interface RegionEpiDataRow extends EpiDataRow, Region {}

export class DataFetcher {
  private readonly cache = new Map<
    string,
    Promise<RegionEpiDataRow[]> | Promise<EpiDataRow & RegionInfo> | Promise<SensorTrend> | Promise<SensorTrend[]>
  >();
  private primarySensorKey = '';
  private primaryRegionId = '';
  private primaryTimeValue = 0;
  private primaryWindowRange = '';

  constructor(public readonly asOf: Date | EpiWeek | null = null) {}

  toDateKey(sensor: { key: string }, region: { id: string; level: string }, date: DateParam, suffix = ''): string {
    const s = this.primarySensorKey === sensor.key ? 'SENSOR' : sensor.key;
    const r =
      this.primaryRegionId === region.id && region.level !== 'nation' ? 'REGION' : `${region.level}-${region.id}`;
    const d = this.primaryTimeValue === date.timeValue ? 'DATE' : date.timeValue;
    return `${s}@${r}@${d}${suffix ? '@' : ''}${suffix}`;
  }

  toWindowKey(
    sensor: { key: string },
    region: { id: string; level: string },
    timeFrame: TimeFrame,
    suffix = '',
  ): string {
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
    const r = fetchTriple(lSensor, regions, lDate.value, { asOf: this.asOf }).then(addNameInfos);
    this.cache.set(key, r);
    return r;
  }

  fetch1Sensor1RegionNDates(
    sensor: Sensor | SensorParam,
    region: Region | RegionParam,
    timeFrame: TimeFrame,
    { advanced = false } = {},
  ): Promise<RegionEpiDataRow[]> {
    const lSensor = SensorParam.unbox(sensor);
    const lRegion = RegionParam.unbox(region);
    const key = this.toWindowKey(lSensor, lRegion, timeFrame, advanced ? 'advanced' : '');
    if (this.cache.has(key)) {
      return this.cache.get(key) as Promise<RegionEpiDataRow[]>;
    }

    const r = fetchTriple(lSensor, lRegion, timeFrame, { asOf: this.asOf, advanced })
      .then(addNameInfos)
      .then((rows) => addMissing(rows, lSensor.isWeeklySignal ? 'week' : 'day'));
    this.cache.set(key, r);
    return r;
  }

  fetchNSensor1RegionNDates(
    sensors: readonly (Sensor | SensorParam)[],
    region: Region | RegionParam,
    timeFrame: TimeFrame,
    { advanced = false } = {},
  ): Promise<RegionEpiDataRow[]>[] {
    const lSensors = sensors.map((sensor) => SensorParam.unbox(sensor));
    const lRegion = RegionParam.unbox(region);

    const missingSensors = lSensors.filter(
      (d) => !this.cache.has(this.toWindowKey(d, lRegion, timeFrame, advanced ? 'advanced' : '')),
    );

    if (missingSensors.length > 0) {
      const data = fetchTriple(missingSensors, lRegion, timeFrame, { asOf: this.asOf, advanced }).then(addNameInfos);

      for (const sensor of missingSensors) {
        const sensorData = data
          .then((rows) => rows.filter((d) => d.signal === sensor.signal && d.source === sensor.id))
          .then((rows) => addMissing(rows, sensor.isWeeklySignal ? 'week' : 'day'));
        this.cache.set(this.toWindowKey(sensor, lRegion, timeFrame), sensorData);
        if (advanced) {
          this.cache.set(this.toWindowKey(sensor, lRegion, timeFrame, 'advanced'), sensorData);
        }
      }
    }

    // use cached version
    return lSensors.map((sensor) => this.fetch1Sensor1RegionNDates(sensor, lRegion, timeFrame, { advanced }));
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
      const data = fetchTriple(missingSensors, regions, timeFrame, { asOf: this.asOf }).then(addNameInfos);

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

    let r: Promise<(EpiDataRow & Region)[]>;

    if (typeof regions === 'string') {
      r = fetchTriple(lSensor, regions, timeFrame, { asOf: this.asOf }).then(addNameInfos);
    } else {
      // fetch individually for better db performance
      r = Promise.all(regions.map((region) => this.fetch1Sensor1RegionNDates(lSensor, region, timeFrame))).then(
        (rows) => rows.flat(),
      );
    }

    // no missing
    this.cache.set(key, r);
    return r;
  }

  fetch1Sensor1Region1DateTrend(
    sensor: Sensor | SensorParam,
    region: Region | RegionParam,
    date: DateParam,
  ): Promise<SensorTrend> {
    const lSensor = SensorParam.unbox(sensor);
    const lRegion = RegionParam.unbox(region);
    const lDate = date;
    const key = this.toDateKey(lSensor, lRegion, lDate, `trend`);
    if (this.cache.has(key)) {
      return this.cache.get(key) as Promise<SensorTrend>;
    }
    const trend = fetchTrendSR(lSensor, lRegion, lDate.value, lDate.windowTimeFrame).then((rows) => {
      return asSensorTrend(lDate.value, lSensor.highValuesAre, rows?.[0], {
        factor: lSensor.valueScaleFactor,
      });
    });
    this.cache.set(key, trend);
    return trend;
  }

  fetchNSensors1Region1DateTrend(
    sensors: readonly (Sensor | SensorParam)[],
    region: Region | RegionParam,
    date: DateParam,
  ): Promise<SensorTrend>[] {
    const lSensors = sensors.map((sensor) => SensorParam.unbox(sensor));
    const lRegion = RegionParam.unbox(region);
    const lDate = date;
    const missingSensors = lSensors.filter(
      (sensor) => !this.cache.has(this.toDateKey(sensor, lRegion, lDate, `trend`)),
    );
    if (missingSensors.length > 0) {
      const trends = fetchTrendS(missingSensors, lRegion, lDate.value, lDate.windowTimeFrame);
      for (const sensor of missingSensors) {
        const trendData = trends.then((rows) => {
          const row = rows.find((d) => d.signal_source === sensor.id && d.signal_signal === sensor.signal);
          return asSensorTrend(lDate.value, sensor.highValuesAre, row, {
            factor: sensor.valueScaleFactor,
          });
        });
        this.cache.set(this.toDateKey(sensor, lRegion, lDate, `trend`), trendData);
      }
    }
    // use cached version
    return lSensors.map((sensor) => this.fetch1Sensor1Region1DateTrend(sensor, region, date));
  }

  fetch1SensorNRegionsDateTrend(
    sensor: Sensor | SensorParam,
    regions: readonly (Region | RegionParam)[],
    date: DateParam,
  ): Promise<SensorTrend>[] {
    const lSensor = SensorParam.unbox(sensor);
    const lRegions = regions.map((region) => RegionParam.unbox(region));
    const lDate = date;
    const missingRegions = lRegions.filter(
      (region) => !this.cache.has(this.toDateKey(lSensor, region, lDate, `trend`)),
    );
    if (missingRegions.length > 0) {
      const trends = fetchTrendR(lSensor, missingRegions, lDate.value, lDate.windowTimeFrame);
      for (const region of missingRegions) {
        const trendData = trends.then((rows) => {
          const row = rows.find(
            (d) =>
              d.geo_type === fixLevel(region.level) && d.geo_value.toLowerCase() === region.propertyId.toLowerCase(),
          );
          return asSensorTrend(lDate.value, lSensor.highValuesAre, row, {
            factor: lSensor.valueScaleFactor,
          });
        });
        this.cache.set(this.toDateKey(lSensor, region, lDate, `trend`), trendData);
      }
    }
    // use cached version
    return lRegions.map((region) => this.fetch1Sensor1Region1DateTrend(lSensor, region, date));
  }

  fetch1Sensor1RegionNDatesTrend(
    sensor: Sensor | SensorParam,
    region: Region | RegionParam,
    timeFrame: TimeFrame,
  ): Promise<SensorTrend[]> {
    const lSensor = SensorParam.unbox(sensor);
    const lRegion = RegionParam.unbox(region);
    const key = this.toWindowKey(lSensor, lRegion, timeFrame, 'trends');
    if (this.cache.has(key)) {
      return this.cache.get(key) as Promise<SensorTrend[]>;
    }

    const trends = callTrendSeriesAPI(
      lSensor.isWeeklySignal ? 'week' : 'day',
      SourceSignalPair.from(lSensor),
      GeoPair.from(lRegion),
      timeFrame,
      lSensor.isWeeklySignal ? 1 : 7,
      {
        exclude: ['signal_signal', 'signal_source', 'geo_type', 'geo_value'],
      },
    ).then((trends) => {
      return trends.map((row) =>
        asSensorTrend(parseAPITime(row.date), lSensor.highValuesAre, row, {
          factor: lSensor.valueScaleFactor,
        }),
      );
    });
    this.cache.set(key, trends);
    return trends;
  }

  fetch1Sensor1RegionSparkline(
    sensor: Sensor | SensorParam,
    region: Region | RegionParam,
    date: DateParam,
  ): Promise<RegionEpiDataRow[]> {
    const lSensor = SensorParam.unbox(sensor);
    const lRegion = RegionParam.unbox(region);
    const key = this.toWindowKey(lSensor, lRegion, date.sparkLineTimeFrame);
    if (this.cache.has(key)) {
      return this.cache.get(key) as Promise<RegionEpiDataRow[]>;
    }
    // load window since we gonna most likely need it anyhow
    const r = this.fetch1Sensor1RegionNDates(sensor, region, date.windowTimeFrame).then((rows) =>
      rows.filter((row) => date.sparkLineTimeFrame.filter(row)),
    );
    this.cache.set(key, r);
    return r;
  }

  fetchNSensor1RegionSparklines(
    sensors: readonly (Sensor | SensorParam)[],
    region: Region | RegionParam,
    date: DateParam,
  ): Promise<RegionEpiDataRow[]>[] {
    return this.fetchNSensor1RegionNDates(sensors, region, date.sparkLineTimeFrame);
  }

  fetch1SensorNRegionsSparklines(
    sensor: Sensor | SensorParam,
    regions: readonly (Region | RegionParam)[],
    date: DateParam,
  ): Promise<RegionEpiDataRow[]>[] {
    if (regions.length === 0) {
      return [];
    }
    const lSensor = SensorParam.unbox(sensor);
    const lRegions = regions.map((region) => RegionParam.unbox(region));
    const lDate = date;
    const missingRegions = lRegions.filter(
      (region) => !this.cache.has(this.toWindowKey(lSensor, region, lDate.sparkLineTimeFrame)),
    );
    if (missingRegions.length > 0) {
      const lookup = fetchTriple(lSensor, missingRegions, lDate.sparkLineTimeFrame, { asOf: this.asOf })
        .then(addNameInfos)
        .then(groupByRegion);
      for (const region of missingRegions) {
        const regionData = lookup.then((l) => {
          return addMissing(l.get(region.propertyId) ?? [], lSensor.isWeeklySignal ? 'week' : 'day');
        });
        this.cache.set(this.toWindowKey(lSensor, region, lDate.sparkLineTimeFrame), regionData);
      }
    }
    // use cached version
    return lRegions.map((region) => this.fetch1Sensor1RegionSparkline(lSensor, region, date));
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
    const r = fetchTriple(lSensor, lRegion, lDate.value, { advanced: true, asOf: this.asOf })
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
      const data = fetchTriple(missingSensors, lRegion, lDate.value, { advanced: true, asOf: this.asOf }).then(
        addNameInfos,
      );
      for (const sensor of missingSensors) {
        const sensorData = data.then((rows) => rows.find((d) => d.signal === sensor.signal && d.source === sensor.id)!);

        this.cache.set(this.toDateKey(sensor, lRegion, lDate, 'details'), sensorData);
      }
    }
    // use cached version
    return lSensors.map((sensor) => this.fetch1Sensor1Region1DateDetails(sensor, lRegion, lDate));
  }

  fetch1SensorMaxDateAndIssue(
    sensor: Sensor | SensorParam,
    manager: MetaDataManager,
  ): Promise<{ maxTime: Date; maxIssue: Date }> {
    const s = SensorParam.unbox(sensor);
    const meta = manager.getMetaData(s);
    const today = timeDay.floor(new Date());
    if (!meta) {
      return Promise.resolve({ maxTime: today, maxIssue: today });
    }
    if (timeDay.count(meta.maxIssue, today) > 4) {
      // more than 4 days lag, assume it is correct
      return Promise.resolve(meta);
    }
    let region: Region;
    if (s.levels.includes('nation')) {
      region = nationInfo;
    } else if (s.levels.includes('state')) {
      region = getInfoByName('PA')!;
    } else if (s.levels.includes('county')) {
      region = getInfoByName('42003')!;
    } else {
      region = nationInfo;
    }
    const data = this.fetch1Sensor1RegionNDates(
      sensor,
      region,
      new TimeFrame(timeDay.offset(meta.maxTime, -1), today),
      {
        advanced: true,
      },
    );
    return data.then((rows) => {
      return rows.reduce(
        (acc, v) => {
          if (v.date_value >= acc.maxTime && v != null && !Number.isNaN(v.value)) {
            return {
              maxTime: v.date_value,
              maxIssue: parseAPITime(v.issue),
            };
          }
          return acc;
        },
        { maxTime: meta!.maxTime, maxIssue: meta!.maxIssue },
      );
    });
  }

  prefetchNSensorMaxDateAndIssue(sensors: (Sensor | SensorParam)[], manager: MetaDataManager) {
    if (sensors.length === 0) {
      return;
    }
    const s = SensorParam.unbox(sensors[0]);
    const meta = manager.getMetaData(s);
    const today = timeDay.floor(new Date());
    if (!meta) {
      // no meta data at all?
      return;
    }
    if (timeDay.count(meta.maxIssue, today) > 4) {
      // more than 4 days lag, assume it is correct
      return;
    }
    let region: Region;
    if (s.levels.includes('nation')) {
      region = nationInfo;
    } else if (s.levels.includes('state')) {
      region = getInfoByName('PA')!;
    } else if (s.levels.includes('county')) {
      region = getInfoByName('42003')!;
    } else {
      region = nationInfo;
    }
    void this.fetchNSensor1RegionNDates(sensors, region, new TimeFrame(timeDay.offset(meta.maxTime, -1), today), {
      advanced: true,
    });
  }
}
