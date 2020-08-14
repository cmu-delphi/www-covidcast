import { callAPIEndPoint } from './api';
import { combineAverageWithCount, parseAPITime, formatAPITime } from './utils';

/**
 * @typedef {import('../stores/constants').SensorEntry} SensorEntry
 */
/**
 * @typedef {object} EpiDataRow
 * @property {number} direction
 * @property {string} geo_value
 * @property {number} issue
 * @property {number} lag
 * @property {number | null} sample_size
 * @property {stderr | null} stderr
 * @property {number} time_value
 * @property {Date} date_value the time_value as a Date
 * @property {number} value
 */

const START_TIME_RANGE = parseAPITime('20100101');
const END_TIME_RANGE = parseAPITime('20500101');
// TODO use LRU map

// Note: store the promise to also have hits on currently loading ones
/**
 * @type {Map<string, Promise<EpiDataRow[]>>}
 */
const regionSliceCache = new Map();
/**
 * @type {Map<string, Promise<EpiDataRow[]>>}
 */
const timeSliceCache = new Map();

/**
 * @param {SensorEntry} sensorEntry
 * @param {string} level
 * @param {string} date
 */
function toRegionCacheKey(sensorEntry, level, date) {
  return `${sensorEntry.key}-${level}-${date instanceof Date ? formatAPITime(date) : date}`;
}
/**
 * @param {SensorEntry} sensorEntry
 * @param {string} level
 * @param {string} region
 */
function toTimeSliceCacheKey(sensorEntry, level, region) {
  return `${sensorEntry.key}-${level}-${region}`;
}

function parseData(data) {
  for (const row of data) {
    if (row.time_value == null) {
      row.date_value = null;
      continue;
    }
    row.date_value = parseAPITime(row.time_value.toString());
  }
  return data;
}

/**
 *
 * @param {SensorEntry} sensorEntry
 * @param {string} level
 * @param {string} date
 * @returns {Promise<EpiDataRow[]>}
 */
export function fetchRegionSlice(sensorEntry, level, date) {
  const cacheKey = toRegionCacheKey(sensorEntry, level, date);

  const cacheEntry = regionSliceCache.get(cacheKey);

  if (cacheEntry) {
    // cache hit
    return cacheEntry;
  }

  const promise = Promise.all([
    callAPIEndPoint(sensorEntry.api, sensorEntry.id, sensorEntry.signal, level, date, '*'),
    sensorEntry.additionalSignal
      ? callAPIEndPoint(sensorEntry.api, sensorEntry.id, sensorEntry.additionalSignal, level, date, '*')
      : null,
  ]).then(([d, d1]) => {
    if (d.result < 0 || d.message.includes('no results')) {
      return [];
    }
    const data = d1 ? combineAverageWithCount(d, d1) : d.epidata;
    return parseData(data);
  });
  regionSliceCache.set(cacheKey, promise);
  return promise;
}
/**
 * @param {SensorEntry} sensorEntry
 * @param {string} level
 * @param {string | undefined} region
 * @param {Date} startDate
 * @param {Date} endDate
 * @returns {Promise<EpiDataRow[]>}
 */
export function fetchCustomTimeSlice(sensorEntry, level, region, startDate, endDate) {
  if (!region) {
    return Promise.resolve([]);
  }
  const timeRange = `${formatAPITime(startDate)}-${formatAPITime(endDate)}`;
  return callAPIEndPoint(sensorEntry.api, sensorEntry.id, sensorEntry.signal, level, timeRange, region).then((d) => {
    if (d.result < 0 || d.message.includes('no results')) {
      return [];
    }
    return parseData(d.epidata);
  });
}

/**
 * @param {SensorEntry} sensorEntry
 * @param {string} level
 * @param {string | undefined} region
 * @returns {Promise<EpiDataRow[]>}
 */
export function fetchTimeSlice(sensorEntry, level, region) {
  if (!region) {
    return Promise.resolve([]);
  }

  const cacheKey = toTimeSliceCacheKey(sensorEntry, level, region);
  const cacheEntry = timeSliceCache.get(cacheKey);

  if (cacheEntry) {
    return cacheEntry;
  }

  const promise = fetchCustomTimeSlice(sensorEntry, level, region, START_TIME_RANGE, END_TIME_RANGE);
  timeSliceCache.set(cacheEntry, promise);
  return promise;
}
