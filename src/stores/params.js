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
/**
 * @typedef {import('./trend').Trend} Trend
 */

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
  }

  /**
   *
   * @param {Date} date
   * @param {(date: Date, value: number) => Date} offset
   * @param {number} offsetFactor
   */
  static compute(date, offset, offsetFactor) {
    let max = offset(date, offsetFactor / 2);
    const maxDate = yesterdayDate;
    if (max > maxDate) {
      max = maxDate;
    }
    const min = offset(max, -offsetFactor);
    return new TimeFrame(min, max);
  }

  /**
   * @param {EpiDataRow} row
   */
  filter(row) {
    return row.date_value >= this.min && row.date_value <= this.max;
  }
}

/**
 * @param {Date} date
 */
function computeSparklineTimeFrame(date) {
  return TimeFrame.compute(date, timeWeek.offset, 4);
}

/**
 * @param {Date} date
 */
function computeVisibleTimeFrame(date) {
  return TimeFrame.compute(date, timeMonth.offset, 4);
}

export class DateParam {
  /**
   * @param {Date} date
   */
  constructor(date) {
    this.cache = new Map();
    this.timeValue = toTimeValue(date);
    this.value = date;

    this.sparkLine = computeSparklineTimeFrame(date);
    this.timeFrame = computeVisibleTimeFrame(date);
  }

  /**
   * @param {Date} date
   */
  set(date) {
    currentDate.set(formatAPITime(date));
  }

  /**
   * @param {Sensor|SensorParam} sensor
   * @param {Region|RegionParam} region
   * @returns {Promise<EpiDataRow>}
   */
  fetchRegion(sensor, region) {
    sensor = sensor instanceof SensorParam ? sensor.value : sensor;
    region = region instanceof RegionParam ? region.value : region;
    const key = `${sensor.key}:${region.level}:${region.propertyId}`;
    if (this.cache.has(key)) {
      return this.cache.get(key);
    }
    const r = fetchData(sensor, region.level, region.propertyId, this.value, {
      time_value: this.timeValue,
    })
      .then(addNameInfos)
      .then((r) => r[0]);
    this.cache.set(key, r);
    return r;
  }
  /**
   * @param {Sensor|SensorParam} sensor
   * @param {string} level
   * @param {string} geo
   * @returns {Promise<EpiDataRow[]>}
   */
  fetchMultiRegions(sensor, level, geo) {
    sensor = sensor instanceof SensorParam ? sensor.value : sensor;
    const key = `${sensor.key}:${level}:${geo}`;
    if (this.cache.has(key)) {
      return this.cache.get(key);
    }
    const r = fetchData(
      sensor,
      level,
      geo,
      this.value,
      {
        time_value: this.timeValue,
      },
      {
        multiValues: false,
      },
    ).then(addNameInfos);
    this.cache.set(key, r);
    return r;
  }
}

export class SensorParam {
  /**
   * @param {SensorEntry} sensor
   */
  constructor(sensor) {
    this.cache = new Map();
    this.key = sensor.key;
    this.value = sensor;
    this.isCasesOrDeath = sensor.isCasesOrDeath;
    this.isPercentage = sensor.format == 'percent';
    this.isInverted = isInverted(sensor);
  }

  formatValue(value) {
    if (value == null || Number.isNaN(value)) {
      return 'N/A';
    }
    return this.value.formatValue(value);
  }

  /**
   * @param {SensorEntry} date
   */
  set(sensor) {
    currentSensor.set(sensor.key);
  }

  /**
   * @param {Region|RegionParam} region
   * @param {TimeFrame} timeFrame
   * @return {Promise<EpiDataRow[]>}
   */
  fetchTimeSeries(region, timeFrame) {
    region = region instanceof RegionParam ? region.value : region;
    const key = `${region.level}:${timeFrame.range}:${region.propertyId}`;
    if (this.cache.has(key)) {
      return this.cache.get(key);
    }
    const r = fetchData(
      this.value,
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
      .then((rows) => addMissing(rows, this.value));
    this.cache.set(key, r);
    return r;
  }

  /**
   * @param {Region[]} region
   * @param {TimeFrame} timeFrame
   * @return {Promise<EpiDataRow[]>}
   */
  fetchMultiTimeSeries(regions, timeFrame) {
    if (regions.length === 0) {
      return Promise.resolve([]);
    }
    // heuristic of we can fetch with one:
    const level = regions[0].level;
    const geo = regions.map((d) => d.propertyId).join(',');
    const key = `${level}:${timeFrame.range}:${geo}`;
    if (this.cache.has(key)) {
      return this.cache.get(key);
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
          this.sensor,
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
    this.cache.set(key, r);
    return r;
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
    this.cache = new Map();
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

  /**
   * @param {Sensor|SensorParam} sensor
   * @param {TimeFrame} timeFrame
   * @return {Promise<EpiDataRow[]>}
   */
  fetchTimeSeries(sensor, timeFrame) {
    sensor = sensor instanceof SensorParam ? sensor.value : sensor;
    const key = `${sensor.key}:${timeFrame.range}`;
    if (this.cache.has(key)) {
      return this.cache.get(key);
    }
    const r = fetchData(
      sensor,
      this.value.level,
      this.value.propertyId,
      timeFrame.range,
      {
        geo_value: this.value.propertyId,
      },
      {
        multiValues: false,
      },
    )
      .then(addNameInfos)
      .then((rows) => addMissing(rows, sensor));
    this.cache.set(key, r);
    return r;
  }

  /**
   * @param {Sensor|SensorParam} sensor
   * @param {TimeFrame} timeFrame
   * @param {Date|DateParam} date
   * @return {Promise<Trend>}
   */
  fetchTrend(sensor, timeFrame, date) {
    sensor = sensor instanceof SensorParam ? sensor.value : sensor;
    date = date instanceof DateParam ? date.value : date;
    const key = `${sensor.key}:${timeFrame.range}:${date}:trend`;
    if (this.cache.has(key)) {
      return this.cache.get(key);
    }
    const trend = this.fetchTimeSeries(sensor, timeFrame).then((rows) => determineTrend(date, rows));
    this.cache.set(key, trend);
    return trend;
  }
  /**
   * @param {Sensor|SensorParam} sensor
   * @param {TimeFrame} timeFrame
   * @param {TimeFrame} sparkLine
   * @return {Promise<EpiDataRow[]>}
   */
  fetchSparkLine(sensor, timeFrame, sparkLine) {
    sensor = sensor instanceof SensorParam ? sensor.value : sensor;
    const key = `${sensor.key}:${timeFrame.range}:${sparkLine.min}:${sparkLine.max}:spark`;
    if (this.cache.has(key)) {
      return this.cache.get(key);
    }
    const rows = this.fetchTimeSeries(sensor, timeFrame).then((rows) => extractSparkLine(rows, sparkLine, sensor));
    this.cache.set(key, rows);
    return rows;
  }
}

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
