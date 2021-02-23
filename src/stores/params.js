import { timeDay, timeWeek } from 'd3-time';
import { addNameInfos, END_TIME_RANGE, fetchData, formatAPITime, START_TIME_RANGE, addMissing } from '../data';
import { nationInfo } from '../maps';
import { currentDate, currentRegion, yesterdayDate, currentSensor, sensorList } from '.';
import { determineTrend } from './trend';

/**
 * @typedef {import('./constants').SensorEntry} Sensor
 */
/**
 * @typedef {import('../maps').NameInfo} Region
 */
/**
 * @typedef {import('../data').EpiDataRow} EpiDataRow
 */

export function toTimeValue(date) {
  return Number.parseInt(formatAPITime(date), 10);
}

/**
 * @param {Date} date
 */
function computeSparklineTimeFrame(date) {
  let max = timeWeek.offset(date, 2);
  const maxDate = yesterdayDate;
  if (max > maxDate) {
    max = maxDate;
  }
  const min = timeWeek.offset(max, -4);
  return { min, max, difference: timeDay.count(min, max) };
}

/**
 * @typedef {object} DateParam
 * @property {Date} value
 * @property {number} timeValue
 * @property {{min: Date, max: Date, difference: number}} sparkLine
 * @property {(date: Date) => void} set
 * @property {(sensor: Sensor, level: string, geo: string | string[]) => Promise<EpiDataRow[]>} fetchRegions
 * @property {(sensor: Sensor, region: Region)) => Promise<EpiDataRow>} fetchRegion
 */

/**
 * @param {Date} date
 * @returns {DateParam}
 */
export function createDateParam(date) {
  const cache = new Map();
  const timeValue = toTimeValue(date);
  return {
    value: date,
    timeValue,
    set: (date) => {
      currentDate.set(formatAPITime(date));
    },
    sparkLine: computeSparklineTimeFrame(date),
    fetchRegion(sensor, region) {
      const key = `${sensor.key}:${region.level}:${region.propertyId}`;
      if (cache.has(key)) {
        return cache.get(key);
      }
      const r = fetchData(sensor, region.level, region.propertyId, date, {
        time_value: timeValue,
      })
        .then(addNameInfos)
        .then((r) => r[0]);
      cache.set(key, r);
      return r;
    },
    fetchRegions(sensor, level, geo) {
      const key = `${sensor.key}:${level}:${geo}`;
      if (cache.has(key)) {
        return cache.get(key);
      }
      const r = fetchData(
        sensor,
        level,
        geo,
        date,
        {
          time_value: timeValue,
        },
        {
          multiValues: false,
        },
      ).then(addNameInfos);
      cache.set(key, r);
      return r;
    },
  };
}

/**
 * @typedef {object} SensorParam
 * @property {Sensor} value
 * @property {boolean} isCasesOrDeath
 * @property {boolean} isPercentage
 * @property {boolean} isInverted
 * @property {(date: Sensor) => void} set
 * @property {(region: Region) => Promise<EpiDataRow[]>} fetchTimeSeries
 * @property {(level: string, geo: string | string[]) => Promise<EpiDataRow[]>} fetchMultiTimeSeries
 */

/**
 * @param {Sensor} sensor
 * @returns {SensorParam}
 */
export function createSensorParam(sensor) {
  const cache = new Map();
  return {
    value: sensor,
    isCasesOrDeath: sensor.isCasesOrDeath,
    isPercentage: sensor.format == 'percent',
    isInverted: sensor.colorScaleId === 'interpolateYlGnBu',
    set: (sensor) => {
      currentSensor.set(sensor.key);
    },
    fetchTimeSeries(region) {
      const key = `${region.level}:${region.propertyId}`;
      if (cache.has(key)) {
        return cache.get(key);
      }
      const r = fetchData(
        sensor,
        region.level,
        region.propertyId,
        `${formatAPITime(START_TIME_RANGE)}-${formatAPITime(END_TIME_RANGE)}`,
        {
          geo_value: region.propertyId,
        },
        {
          multiValues: false,
        },
      )
        .then(addNameInfos)
        .then((rows) => addMissing(rows, sensor));
      cache.set(key, r);
      return r;
    },
    fetchMultiTimeSeries(level, geo) {
      const key = `${level}:${geo}`;
      if (cache.has(key)) {
        return cache.get(key);
      }
      const r = fetchData(
        sensor,
        level,
        geo,
        `${formatAPITime(START_TIME_RANGE)}-${formatAPITime(END_TIME_RANGE)}`,
        {},
        {
          multiValues: false,
        },
      ).then(addNameInfos);
      cache.set(key, r);
      return r;
    },
  };
}
export const CASES = createSensorParam(sensorList.find((d) => d.isCasesOrDeath && d.name.includes('Cases')));
export const DEATHS = createSensorParam(sensorList.find((d) => d.isCasesOrDeath && d.name.includes('Deaths')));

/**
 * @typedef {Region} RegionParam
 * @property {Region} value
 * @property {(Region) => void} set
 * @property {(sensor: Sensor) => Promise<EpiDataRow[]>} fetchTimeSeries
 * @property {(sensor: Sensor, sparkLine: {min: Date, max: Date}) => Promise<EpiDataRow[]>} fetchSparkLine
 * @property {(sensor: Sensor, date: Date) => Promise<import('./trend').Trend>} fetchTrend
 */

/**
 * @param {Region} region
 * @returns {RegionParam}
 */
export function createRegionParam(region) {
  region = region || nationInfo;
  const cache = new Map();
  return {
    ...region,
    value: region,
    set: (region) => {
      currentRegion.set(region.propertyId);
    },
    fetchTimeSeries(sensor) {
      const key = sensor.key;
      if (cache.has(key)) {
        return cache.get(key);
      }
      const r = fetchData(
        sensor,
        region.level,
        region.propertyId,
        `${formatAPITime(START_TIME_RANGE)}-${formatAPITime(END_TIME_RANGE)}`,
        {
          geo_value: region.propertyId,
        },
        {
          multiValues: false,
        },
      )
        .then(addNameInfos)
        .then((rows) => addMissing(rows, sensor));
      cache.set(key, r);
      return r;
    },
    fetchTrend(sensor, date) {
      const key = `${sensor.key}:${date}:trend`;
      if (cache.has(key)) {
        return cache.get(key);
      }
      const trend = this.fetchTimeSeries(sensor).then((rows) => determineTrend(date, rows));
      cache.set(key, trend);
      return trend;
    },
    fetchSparkLine(sensor, sparkLine) {
      const key = `${sensor.key}:${sparkLine.min}:${sparkLine.max}:spark`;
      if (cache.has(key)) {
        return cache.get(key);
      }
      const rows = this.fetchTimeSeries(sensor).then((rows) =>
        rows.filter((d) => d.date_value >= sparkLine.min && d.date_value <= sparkLine.max),
      );
      cache.set(key, rows);
      return rows;
    },
  };
}
