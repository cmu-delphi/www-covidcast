import {
  sensorMap as sensorMapStore,
  currentData,
  regionSliceCache,
  regionData,
  currentRegion,
  currentRegionName,
  timeSliceCache,
  times,
  currentDate,
  yesterday,
  stats,
  currentSensor,
  currentLevel,
} from '../stores';
import { get } from 'svelte/store';
import { callAPI, callMetaAPI } from './api';
import { checkWIP, combineAverageWithCount } from './utils';
import { isCountSignal, isCasesSignal, isDeathSignal } from './signals';

function toRegionCacheKey(sensor, level, date) {
  return sensor + level + date;
}
function toTimeSliceCacheKey(sensor, level, region) {
  return sensor + level + region;
}
function toStatsRegionKey(sensorKey, region) {
  return sensorKey + '_' + region;
}

// We cache API calls for all regions at a given time and update currentData.
export function updateRegionSliceCache(sensor, level, date, reason = 'unspecified') {
  const sEntry = get(sensorMapStore).get(sensor);

  if (!sEntry.levels.includes(level) || date > get(times).get(sensor)[1] || reason === 'level change') {
    return Promise.resolve(null);
  }
  const cacheKey = toRegionCacheKey(sensor, level, date);
  const cacheEntry = get(regionSliceCache).get(cacheKey);

  if (cacheEntry) {
    // cache hit
    currentData.set(cacheEntry);
    return Promise.resolve(cacheEntry);
  }

  return callAPI(sEntry.id, sEntry.signal, level, date, '*').then((d) => {
    if (d.result < 0 || d.message.includes('no results')) {
      currentData.set([]);
      regionSliceCache.update((m) => m.set(cacheKey, []));
      return [];
    }

    // deaths_incidence_prop
    if (sEntry.signal === 'deaths_7dav_incidence_prop') {
      return callAPI(sEntry.id, checkWIP(sEntry.signal, 'deaths_incidence_prop'), level, date, '*').then((d1) => {
        const extended = combineAverageWithCount(d, d1);
        currentData.set(extended);
        regionSliceCache.update((m) => m.set(cacheKey, extended));
        return extended;
      });
    }
    // deaths needs both count and ratio
    if (isDeathSignal(sEntry.signal)) {
      return callAPI(sEntry.id, checkWIP(sEntry.signal, 'deaths_incidence_num'), level, date, '*').then((d1) => {
        let extended = combineAverageWithCount(d, d1);
        currentData.set(extended);
        regionSliceCache.update((m) => m.set(cacheKey, extended));
        return extended;
      });
    }
    // confirmed_incidence_prop
    if (sEntry.signal === 'confirmed_7dav_incidence_prop') {
      return callAPI(sEntry.id, checkWIP(sEntry.signal, 'confirmed_incidence_prop'), level, date, '*').then((d1) => {
        const extended = combineAverageWithCount(d, d1);
        currentData.set(extended);
        regionSliceCache.update((m) => m.set(cacheKey, extended));
        return extended;
      });
    }
    // cases needs both count and ratio
    if (isCasesSignal(sEntry.signal)) {
      return callAPI(sEntry.id, checkWIP(sEntry.signal, 'confirmed_incidence_num'), level, date, '*').then((d1) => {
        const extended = combineAverageWithCount(d, d1);
        currentData.set(extended);
        regionSliceCache.update((m) => m.set(cacheKey, extended));
        return extended;
      });
    }

    // everything else
    currentData.set(d.epidata);
    regionSliceCache.update((m) => m.set(cacheKey, d.epidata));
    return d.epidata;
  });
}

// We cache API calls for all time at a given region and update regionData.
export function updateTimeSliceCache(sensor, level, region) {
  const sEntry = get(sensorMapStore).get(sensor);

  if (!region) {
    regionData.set([]);
    return Promise.resolve([]);
  }

  // check if the currentRegion has data on the current date
  const date = get(currentDate);
  const checkIfCurrentRegionHasDataOnCurrentDate = (regionData = []) => {
    return regionData.some((item) => item.time_value == date);
  };

  const cacheKey = toTimeSliceCacheKey(sensor, level, region);
  const cacheEntry = get(timeSliceCache).get(cacheKey);

  if (cacheEntry) {
    regionData.set(cacheEntry);
    if (!checkIfCurrentRegionHasDataOnCurrentDate(cacheEntry)) {
      currentRegion.set('');
      currentRegionName.set('');
    }
    return Promise.resolve(cacheEntry);
  }

  return callAPI(sEntry.id, sEntry.signal, level, '20100101-20500101', region).then((d) => {
    if (!checkIfCurrentRegionHasDataOnCurrentDate(d.epidata)) {
      currentRegion.set('');
      currentRegionName.set('');
      timeSliceCache.update((m) => m.set(cacheKey, d.epidata));
      return d.epidata;
    }
    // creating deepcopy to avoid tampering with the data stored in cache
    const epi_data = JSON.parse(JSON.stringify(d.epidata));
    regionData.set(d.epidata);
    timeSliceCache.update((m) => m.set(cacheKey, epi_data));
    return epi_data;
  });
}

function processMetaData(meta) {
  const timeMap = new Map();
  const statsMap = new Map();

  /**
   * @type {Map}
   */
  const sensorMap = get(sensorMapStore);

  sensorMap.forEach((sEntry, sensorKey) => {
    // need to change mean / std for counts
    if (isCountSignal(sEntry.signal)) {
      loadCountSignal(sEntry, sensorKey, meta, timeMap, statsMap);
    } else {
      loadRegularSignal(sEntry, sensorKey, meta, timeMap, statsMap);
    }
  });

  // update store once
  stats.set(statsMap);
  times.set(timeMap);

  // validate level and date data

  let l = get(currentLevel);
  const sensor = get(currentSensor);
  if (!sensorMap.get(sensor).levels.includes(l)) {
    l = sensorMap.get(sensor).levels[0];
    currentLevel.set(l);
  }

  let date = get(currentDate);
  // Magic number of default date - if no URL params, use max date
  // available
  if (date === 20100420) {
    date = timeMap.get(sensor)[1];
    currentDate.set(date);
  }

  return {
    level: l,
    date,
  };
}

function loadRegularSignal(sEntry, sensorKey, meta, timeMap, statsMap) {
  const matchedMeta = meta.epidata.find(
    (d) => d.data_source === sEntry.id && d.signal === sEntry.signal && d.time_type === 'day',
  );

  if (matchedMeta) {
    if (matchedMeta.max_time > yesterday) {
      matchedMeta.max_time = yesterday;
    }

    timeMap.set(sensorKey, [matchedMeta.min_time, matchedMeta.max_time]);

    statsMap.set(sensorKey, {
      mean: matchedMeta.mean_value,
      std: matchedMeta.stdev_value,
    });
    return;
  }
  // If no metadata, use information from sensors
  // Used for testing new data
  timeMap.set(sensorKey, [sEntry.minTime, sEntry.maxTime]);
  statsMap.set(sensorKey, {
    mean: sEntry.mean,
    std: sEntry.std,
  });
}

function loadCountSignal(sEntry, sensorKey, meta, timeMap, statsMap) {
  const regions = sEntry.levels;

  regions.forEach((region) => {
    const statsKey = toStatsRegionKey(sensorKey, region);

    const matchedMeta = meta.epidata.find(
      (d) =>
        d.data_source === sEntry.id && d.signal === sEntry.signal && d.time_type === 'day' && d.geo_type === region,
    );

    if (matchedMeta) {
      if (matchedMeta.max_time > yesterday) {
        matchedMeta.max_time = yesterday;
      }

      timeMap.set(sensorKey, [matchedMeta.min_time, matchedMeta.max_time]);

      statsMap.set(statsKey, {
        mean: matchedMeta.mean_value,
        std: matchedMeta.stdev_value,
      });
      return;
    }

    // If no metadata, use information from sensors
    // Used for testing new data
    timeMap.set(sensorKey, [sEntry.minTime, sEntry.maxTime]);
    if (region === 'county') {
      statsMap.set(statsKey, {
        mean: sEntry.county_mean,
        std: sEntry.county_std,
      });
    } else if (region === 'msa') {
      statsMap.set(statsKey, {
        mean: sEntry.msa_mean,
        std: sEntry.msa_std,
      });
    } else {
      statsMap.set(statsKey, {
        mean: sEntry.state_mean,
        std: sEntry.state_std,
      });
    }
  });
}

export function loadMetaData() {
  return callMetaAPI().then((meta) => processMetaData(meta));
}
