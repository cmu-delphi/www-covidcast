import { timeDay, timeMonth, timeWeek } from 'd3-time';
import { addNameInfos, fetchData, formatAPITime, addMissing, fitRange } from '../data';
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
  return {
    min,
    max,
    difference: timeDay.count(min, max),
    range: `${formatAPITime(min)}-${formatAPITime(max)}`,
  };
}

/**
 * @param {Date} date
 */
function computeVisibleTimeFrame(date) {
  let max = timeMonth.offset(date, 2);
  const maxDate = yesterdayDate;
  if (max > maxDate) {
    max = maxDate;
  }
  const min = timeMonth.offset(max, -4);
  return {
    min,
    max,
    difference: timeDay.count(min, max),
    range: `${formatAPITime(min)}-${formatAPITime(max)}`,
  };
}

/**
 * @typedef {object} DateParam
 * @property {Date} value
 * @property {number} timeValue
 * @property {{min: Date, max: Date, difference: number, range: string}} sparkLine
 * @property {{min: Date, max: Date, difference: number, range: string}} timeFrame
 * @property {(date: Date) => void} set
 * @property {(sensor: Sensor, level: string, geo: string | string[]) => Promise<EpiDataRow[]>} fetchMultiRegions
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
    timeFrame: computeVisibleTimeFrame(date),
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
    fetchMultiRegions(sensor, level, geo) {
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
 * @property {(region: Region, timeFrame: {range: string}) => Promise<EpiDataRow[]>} fetchTimeSeries
 * @property {(regions: Region[], timeFrame: {range: string, difference: number}) => Promise<EpiDataRow[]>} fetchMultiTimeSeries
 */

/**
 *
 * @param {Sensor} sensor
 */
export function isInverted(sensor) {
  return sensor.colorScaleId === 'interpolateYlGnBu';
}

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
    isInverted: isInverted(sensor),
    set: (sensor) => {
      currentSensor.set(sensor.key);
    },
    fetchTimeSeries(region, timeFrame) {
      const key = `${region.level}:${timeFrame.range}:${region.propertyId}`;
      if (cache.has(key)) {
        return cache.get(key);
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
        },
      )
        .then(addNameInfos)
        .then((rows) => addMissing(rows, sensor));
      cache.set(key, r);
      return r;
    },
    fetchMultiTimeSeries(regions, timeFrame) {
      if (regions.length === 0) {
        return Promise.resolve([]);
      }
      // heuristic of we can fetch with one:
      const level = regions[0].level;
      const geo = regions.map((d) => d.propertyId).join(',');
      const key = `${level}:${timeFrame.range}:${geo}`;
      if (cache.has(key)) {
        return cache.get(key);
      }
      // assuming data starts around february
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
            },
          ),
        );
      }
      const r = Promise.all(data)
        .then((rows) => rows.flat())
        .then(addNameInfos);
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
 * @property {(region: Region, scrollTop?: boolean) => void} set
 * @property {(sensor: Sensor, timeFrame: {range: string}) => Promise<EpiDataRow[]>} fetchTimeSeries
 * @property {(sensor: Sensor, sparkLine: {min: Date, max: Date}) => Promise<EpiDataRow[]>} fetchSparkLine
 * @property {(sensor: Sensor, timeFrame: {range: string}, date: Date) => Promise<import('./trend').Trend>} fetchTrend
 */

/**
 * @param {EpiDataRow[]} data
 * @param {{min: Date, max: Date}} sparkLine
 * @param {Sensor} sensor
 * @returns {EpiDataRow[]}
 */
export function extractSparkLine(data, sparkLine, sensor) {
  const sub = data.filter((d) => d.date_value >= sparkLine.min && d.date_value <= sparkLine.max);
  return fitRange(addMissing(sub, sensor), sensor, sparkLine.min, sparkLine.max);
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
    set: (region, scrollTop) => {
      currentRegion.set(region.propertyId);
      if (scrollTop) {
        window.scrollTo({
          top: 0,
          behavior: 'auto',
        });
      }
    },
    fetchTimeSeries(sensor, timeFrame) {
      const key = `${sensor.key}:${timeFrame.range}`;
      if (cache.has(key)) {
        return cache.get(key);
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
        },
      )
        .then(addNameInfos)
        .then((rows) => addMissing(rows, sensor));
      cache.set(key, r);
      return r;
    },
    fetchTrend(sensor, timeFrame, date) {
      const key = `${sensor.key}:${timeFrame.range}:${date}:trend`;
      if (cache.has(key)) {
        return cache.get(key);
      }
      const trend = this.fetchTimeSeries(sensor, timeFrame).then((rows) => determineTrend(date, rows));
      cache.set(key, trend);
      return trend;
    },
    fetchSparkLine(sensor, timeFrame, sparkLine) {
      const key = `${sensor.key}:${timeFrame.range}:${sparkLine.min}:${sparkLine.max}:spark`;
      if (cache.has(key)) {
        return cache.get(key);
      }
      const rows = this.fetchTimeSeries(sensor, timeFrame).then((rows) => extractSparkLine(rows, sparkLine, sensor));
      cache.set(key, rows);
      return rows;
    },
  };
}
