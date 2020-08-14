import {
  currentData,
  regionData,
  currentRegion,
  currentRegionName,
  times,
  currentDate,
  yesterday,
  stats,
  currentSensor,
  currentLevel,
  MAGIC_START_DATE,
  sensorMap,
} from '../stores';
import { get } from 'svelte/store';
import { callMetaAPI } from './api';
import { fetchRegionSlice, fetchTimeSlice } from './fetchData';

export * from './signals';
export { formatAPITime, parseAPITime } from './utils';

// We cache API calls for all regions at a given time and update currentData.
export function updateRegionSliceCache(sensor, level, date, reason = 'unspecified') {
  const sensorEntry = sensorMap.get(sensor);

  if (!sensorEntry.levels.includes(level) || date > get(times).get(sensor)[1] || reason === 'level change') {
    return Promise.resolve(null);
  }
  return fetchRegionSlice(sensorEntry, level, date).then((r) => {
    currentData.set(r);
    return r;
  });
}

// We cache API calls for all time at a given region and update regionData.
export function updateTimeSliceCache(sensor, level, region) {
  const sensorEntry = sensorMap.get(sensor);

  if (!region) {
    regionData.set([]);
    return Promise.resolve([]);
  }

  // check if the currentRegion has data on the current date
  const date = get(currentDate);
  const checkIfCurrentRegionHasDataOnCurrentDate = (regionData = []) => {
    return regionData.some((item) => item.time_value == date);
  };

  return fetchTimeSlice(sensorEntry, level, region).then((r) => {
    regionData.set(r);
    if (!checkIfCurrentRegionHasDataOnCurrentDate(r)) {
      currentRegion.set('');
      currentRegionName.set('');
    }
    return r;
  });
}

function toStatsRegionKey(sensorKey, region) {
  return sensorKey + '_' + region;
}

function processMetaData(meta) {
  const timeMap = new Map();
  const statsMap = new Map();

  sensorMap.forEach((sEntry, sensorKey) => {
    // need to change mean / std for counts
    if (sEntry.isCount) {
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
  if (date === MAGIC_START_DATE) {
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
