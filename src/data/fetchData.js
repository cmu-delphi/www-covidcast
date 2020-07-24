import { callAPI } from './api';
import { checkWIP, combineAverageWithCount } from './utils';
import { isCasesSignal, isDeathSignal } from './signals';

const TIME_RANGE = '20100101-20500101';
// TODO use LRU map

// Note: store the promise to also have hits on currently loading ones
/**
 * @type {Map<string, Promise<any[]>>}
 */
const regionSliceCache = new Map();
/**
 * @type {Map<string, Promise<any[]>>}
 */
const timeSliceCache = new Map();

function toSensorEntryKey(sensorEntry) {
  return `${sensorEntry.id}-${sensorEntry.signal}`;
}
function toRegionCacheKey(sensorEntry, level, date) {
  return `${toSensorEntryKey(sensorEntry)}-${level}-${date}`;
}
function toTimeSliceCacheKey(sensorEntry, level, region) {
  return `${toSensorEntryKey(sensorEntry)}-${level}-${region}`;
}

function getAdditionalSignal(signal) {
  // deaths_incidence_prop
  if (signal === 'deaths_7dav_incidence_prop') {
    return checkWIP(signal, 'deaths_incidence_prop');
  }
  // deaths needs both count and ratio
  if (isDeathSignal(signal)) {
    return checkWIP(signal, 'deaths_incidence_num');
  }
  // confirmed_incidence_prop
  if (signal === 'confirmed_7dav_incidence_prop') {
    return checkWIP(signal, 'confirmed_incidence_prop');
  }
  // cases needs both count and ratio
  if (isCasesSignal(signal)) {
    return checkWIP(signal, 'confirmed_incidence_num');
  }
  return null;
}

export function fetchRegionSlice(sensorEntry, level, date) {
  const cacheKey = toRegionCacheKey(sensorEntry, level, date);

  const cacheEntry = regionSliceCache.get(cacheKey);

  if (cacheEntry) {
    // cache hit
    return cacheEntry;
  }

  const additionalSignal = getAdditionalSignal(sensorEntry.signal);

  const promise = Promise.all([
    callAPI(sensorEntry.id, sensorEntry.signal, level, date, '*'),
    additionalSignal ? callAPI(sensorEntry.id, additionalSignal, level, date, '*') : null,
  ]).then(([d, d1]) => {
    if (d.result < 0 || d.message.includes('no results')) {
      return [];
    }
    const data = d1 ? combineAverageWithCount(d, d1) : d.epidata;
    return data;
  });
  regionSliceCache.set(cacheKey, promise);
  return promise;
}

export function fetchTimeSlice(sensorEntry, level, region) {
  if (!region) {
    return Promise.resolve([]);
  }

  const cacheKey = toTimeSliceCacheKey(sensorEntry, level, region);
  const cacheEntry = timeSliceCache.get(cacheKey);

  if (cacheEntry) {
    return cacheEntry;
  }

  const promise = callAPI(sensorEntry.id, sensorEntry.signal, level, TIME_RANGE, region).then((d) => {
    timeSliceCache.set(cacheKey, d.epidata);
    return d.epidata;
  });
  timeSliceCache.set(cacheEntry, promise);

  return promise;
}
