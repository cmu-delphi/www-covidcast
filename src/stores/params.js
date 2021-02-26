import { timeDay, timeMonth, timeWeek } from 'd3-time';
import { addNameInfos, fetchData, formatAPITime, addMissing, fitRange, parseAPITime } from '../data';
import { nationInfo } from '../maps';
import { currentDate, currentRegion, yesterdayDate, currentSensor, sensorList } from '.';
import { determineTrend, findMinMaxRow } from './trend';
import { determineMinMax } from '../components/MapBox/colors';
import { formatPercentage } from '../formats';

/**
 * @typedef {import('./constants').SensorEntry} Sensor
 */
/**
 * @typedef {import('../maps').NameInfo} Region
 */
/**
 * @typedef {import('../data').EpiDataRow} EpiDataRow
 */
/**
 * @typedef {import('./trend').Trend} Trend
 */

export const WINDOW_SIZE = 4; // months;
export const SPARKLINE_SIZE = 4; // weeks;

/**
 * @param {Date} date
 * @returns {number}
 */
export function toTimeValue(date) {
  return Number.parseInt(formatAPITime(date), 10);
}

class TimeFrame {
  /**
   * @param {Date} min
   * @param {Date} max
   */
  constructor(min, max) {
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

  toString() {
    return this.range;
  }
  /**
   *
   * @param {Date} date
   * @param {(date: Date, value: number) => Date} offset
   * @param {number} offsetFactor
   */
  static compute(date, offset, offsetFactor, maxDate = yesterdayDate) {
    let max = offset(date, offsetFactor / 2);
    if (max > maxDate) {
      max = maxDate;
    }
    const min = offset(max, -offsetFactor);
    return new TimeFrame(min, max);
  }
}

const ALL_TIME_FRAME = new TimeFrame(parseAPITime('20200101'), yesterdayDate);

export class DataFetcher {
  constructor() {
    this.cache = new Map();

    this.primarySensorKey = '';
    this.primaryRegionId = '';
    this.primaryTimeValue = 0;
    this.primaryWindowRange = '';
  }
  /**
   * @param {Sensor} sensor
   * @param {{id: string, level: string}} region
   * @param {DateParam} date
   */
  toDateKey(sensor, region, date, suffix = '') {
    const s = this.primarySensorKey === sensor.key ? 'SENSOR' : sensor.key;
    const r = this.primaryRegionId === region.id ? 'REGION' : `${region.level}-${region.id}`;
    const d = this.primaryTimeValue === date.timeValue ? 'DATE' : date.timeValue;
    return `${s}:${r}:${d}${suffix ? ':' : ''}${suffix}`;
  }

  /**
   * @param {Sensor} sensor
   * @param {{id: string, level: string}} region
   * @param {TimeFrame} timeFrame
   */
  toWindowKey(sensor, region, timeFrame, suffix = '') {
    const s = this.primarySensorKey === sensor.key ? 'SENSOR' : sensor.key;
    const r = this.primaryRegionId === region.id ? 'REGION' : `${region.level}-${region.id}`;
    const d = this.primaryWindowRange === timeFrame.range ? 'WINDOW' : timeFrame.range;
    return `${s}:${r}:${d}${suffix ? ':' : ''}${suffix}`;
  }

  /**
   * @param {SensorParam} sensor
   * @param {RegionParam} region
   * @param {DateParam} date
   */
  invalidate(sensor, region, date) {
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
      const parts = key.split(':');
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
  fetch1SensorNRegions1Date(sensor, level, geo, date) {
    sensor = sensor instanceof SensorParam ? sensor.value : sensor;
    date = date instanceof DateParam ? date : new DateParam(date);

    const key = this.toDateKey(sensor, { id: geo, level }, date);
    if (this.cache.has(key)) {
      return this.cache.get(key);
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
        factor: sensorFactor(sensor),
      },
    ).then(addNameInfos);
    this.cache.set(key, r);
    return r;
  }

  /**
   * @param {Sensor|SensorParam} sensor
   * @param {Region|RegionParam} region
   * @param {TimeFrame} timeFrame
   * @return {Promise<EpiDataRow[]>}
   */
  fetch1Sensor1RegionNDates(sensor, region, timeFrame) {
    sensor = sensor instanceof SensorParam ? sensor.value : sensor;
    region = region instanceof RegionParam ? region.value : region;
    const key = this.toWindowKey(sensor, region, timeFrame);
    if (this.cache.has(key)) {
      return this.cache.get(key);
    }
    if (
      timeFrame.range !== ALL_TIME_FRAME.range &&
      region.id === this.primaryRegionId &&
      sensor.key === this.primarySensorKey
    ) {
      // fetch all history for the primary one
      const rows = this.fetch1Sensor1RegionNDates(sensor, region, ALL_TIME_FRAME);
      const r = rows.then((rows) => rows.filter(timeFrame.filter));
      this.cache.set(key, r);
      return r;
    }
    const r = fetchData(
      sensor,
      region.level,
      region.propertyId,
      timeFrame.range,
      {
        geo_value: region.propertyId,
      },
      {
        multiValues: false,
        factor: sensorFactor(sensor),
      },
    )
      .then(addNameInfos)
      .then((rows) => addMissing(rows, sensor));
    this.cache.set(key, r);
    return r;
  }

  /**
   * @param {Sensor|SensorParam} sensor
   * @param {Region[]} region
   * @param {TimeFrame} timeFrame
   * @return {Promise<EpiDataRow[]>}
   */
  fetch1SensorNRegionsNDates(sensor, regions, timeFrame) {
    if (regions.length === 0) {
      return Promise.resolve([]);
    }
    sensor = sensor instanceof SensorParam ? sensor.value : sensor;
    const level = regions[0].level;
    const geo = regions.map((d) => d.propertyId).join(',');
    const key = this.toWindowKey(sensor, { level, id: geo }, timeFrame);
    if (this.cache.has(key)) {
      return this.cache.get(key);
    }
    const expectedDays = timeFrame.difference;
    const maxDataRows = 3600;

    const batchSize = Math.floor(maxDataRows / expectedDays);
    // console.log(batchSize);
    const data = [];
    for (let i = 0; i < regions.length; i += batchSize) {
      const slice = regions.slice(i, Math.min(regions.length - 1, i + batchSize));
      data.push(
        fetchData(
          sensor,
          level,
          slice.map((d) => d.propertyId).join(','),
          timeFrame.range,
          {},
          {
            multiValues: false,
            factor: sensorFactor(sensor),
          },
        ),
      );
    }
    const r = Promise.all(data)
      .then((rows) => rows.flat())
      .then(addNameInfos);

    // no missing
    this.cache.set(key, r);
    return r;
  }

  /**
   * @param {Sensor|SensorParam} sensor
   * @param {Region|RegionParam} region
   * @param {DateParam} date
   * @return {Promise<EpiDataRow[]>}
   */
  fetchSparkLine(sensor, region, date) {
    sensor = sensor instanceof SensorParam ? sensor.value : sensor;
    region = region instanceof RegionParam ? region.value : region;
    date = date instanceof DateParam ? date : new DateParam(date);
    const key = this.toWindowKey(sensor, region, date.windowTimeFrame, 'sparkline');
    if (this.cache.has(key)) {
      return this.cache.get(key);
    }
    const rows = this.fetch1Sensor1RegionNDates(sensor, region, date.windowTimeFrame).then((rows) =>
      rows.filter(date.sparkLineTimeFrame.filter),
    );
    this.cache.set(key, rows);
    return rows;
  }

  /**
   * @param {Sensor|SensorParam} sensor
   * @param {Region|RegionParam} region
   * @param {DateParam} date
   * @return {Promise<Trend>}
   */
  fetchWindowTrend(sensor, region, date) {
    sensor = sensor instanceof SensorParam ? sensor.value : sensor;
    region = region instanceof RegionParam ? region.value : region;
    date = date instanceof DateParam ? date : new DateParam(date);
    const key = this.toWindowKey(sensor, region, date.windowTimeFrame, `${date.timeValue}:trend`);
    if (this.cache.has(key)) {
      return this.cache.get(key);
    }
    const trend = this.fetch1Sensor1RegionNDates(sensor, region, date.windowTimeFrame).then((rows) =>
      determineTrend(date.value, rows, sensor.isInverted),
    );
    this.cache.set(key, trend);
    return trend;
  }

  /**
   * @param {Sensor|SensorParam} sensor
   * @param {Region|RegionParam} region
   * @param {Date | DateParam} date
   * @return {Promise<Trend>}
   */
  fetchGlobalTrend(sensor, region, date) {
    sensor = sensor instanceof SensorParam ? sensor.value : sensor;
    region = region instanceof RegionParam ? region.value : region;
    date = date instanceof DateParam ? date.value : date;
    const key = this.toWindowKey(sensor, region, ALL_TIME_FRAME, `${date.timeValue}:trend`);
    if (this.cache.has(key)) {
      return this.cache.get(key);
    }
    const trend = this.fetch1Sensor1RegionNDates(sensor, region, ALL_TIME_FRAME).then((rows) =>
      determineTrend(date, rows, sensor.isInverted),
    );
    this.cache.set(key, trend);
    return trend;
  }

  /**
   * @param {Sensor|SensorParam} sensor
   * @param {Region|RegionParam} region
   * @return {Promise<Trend>}
   */
  fetchGlobalMinMax(sensor, region) {
    sensor = sensor instanceof SensorParam ? sensor.value : sensor;
    region = region instanceof RegionParam ? region.value : region;
    const key = this.toWindowKey(sensor, region, ALL_TIME_FRAME, 'minmax');
    if (this.cache.has(key)) {
      return this.cache.get(key);
    }
    const trend = this.fetch1Sensor1RegionNDates(sensor, region, ALL_TIME_FRAME).then((rows) => findMinMaxRow(rows));
    this.cache.set(key, trend);
    return trend;
  }
}

export class DateParam {
  /**
   * @param {Date} date
   * @param {Sensor?} sensor
   * @param {Map<string, [number, number]>?} timeLookup
   */
  constructor(date, sensor, timeLookup) {
    this.timeValue = toTimeValue(date);
    this.value = date;
    this.allTimeFrame = ALL_TIME_FRAME;
    this.sensorTimeFrame = ALL_TIME_FRAME;
    const entry = sensor && timeLookup ? timeLookup.get(sensor.key) : null;
    if (entry) {
      this.sensorTimeFrame = new TimeFrame(parseAPITime(entry[0]), parseAPITime(entry[1]));
    }
    this.sparkLineTimeFrame = TimeFrame.compute(date, timeWeek.offset, SPARKLINE_SIZE, this.sensorTimeFrame.max);
    this.windowTimeFrame = TimeFrame.compute(date, timeMonth.offset, WINDOW_SIZE, this.sensorTimeFrame.max);
  }

  /**
   * @param {Date} date
   */
  set(date) {
    currentDate.set(formatAPITime(date));
  }
}

/**
 * @param {Sensor} sensor
 */
function sensorFactor(sensor) {
  return sensor.yAxis.startsWith('Fraction') ? 100 : 1;
}

export class SensorParam {
  /**
   * @param {Sensor} sensor
   */
  constructor(sensor) {
    this.key = sensor.key;
    this.name = sensor.name;
    this.value = sensor;
    this.isCasesOrDeath = sensor.isCasesOrDeath;
    this.factor = sensorFactor(sensor);
    this.isPercentage = sensor.format == 'percent' || this.factor > 1;
    this.isInverted = isInverted(sensor);
    this.formatValue = this.isPercentage ? formatPercentage : sensor.formatValue;
    this.unit = this.isPercentage ? '% of pop.' : this.isCasesOrDeath ? 'per 100k people' : '';
  }

  /**
   * @param {Sensor} date
   */
  set(sensor) {
    currentSensor.set(sensor.key);
  }

  /**
   * @param {Map<string, any>} stats
   * @param {Region} region
   */
  domain(stats, region) {
    const domain = determineMinMax(
      stats,
      this.value,
      region.level === 'state' || region.level === 'county' ? 'county' : 'state',
      {},
      false,
    );
    return [domain[0] * this.factor, domain[1] * this.factor];
  }
}

/**
 *
 * @param {Sensor} sensor
 */
export function isInverted(sensor) {
  return sensor.colorScaleId === 'interpolateYlGnBu';
}

export const CASES = new SensorParam(sensorList.find((d) => d.isCasesOrDeath && d.name.includes('Cases')));
export const DEATHS = new SensorParam(sensorList.find((d) => d.isCasesOrDeath && d.name.includes('Deaths')));

export class RegionParam {
  /**
   * @param {Region} region
   */
  constructor(region) {
    region = region || nationInfo;
    this.value = region;
    this.id = region.id;
    this.displayName = region.displayName;
    this.level = region.level;
    this.propertyId = region.propertyId;
    this.region = region.region;
    this.state = region.state;
  }

  /**
   * @param {Region} region
   */
  set(region, scrollTop = false) {
    currentRegion.set(region.propertyId);
    if (scrollTop) {
      window.scrollTo({
        top: 0,
        behavior: 'auto',
      });
    }
  }
}

/**
 * @param {EpiDataRow[]} data
 * @param {TimeFrame} sparkLine
 * @param {Sensor} sensor
 * @returns {EpiDataRow[]}
 */
export function extractSparkLine(data, sparkLine, sensor) {
  return fitRange(addMissing(data.filter(sparkLine.filter), sensor), sensor, sparkLine.min, sparkLine.max);
}

/**
 * @param {(EpiDataRow & {propertyId: string})[]} data
 * @returns {Map<string, EpiDataRow>}
 */
export function groupByRegion(data) {
  const map = new Map();
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
