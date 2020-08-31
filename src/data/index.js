import {
  times,
  currentDate,
  yesterday,
  stats,
  currentSensor,
  currentLevel,
  MAGIC_START_DATE,
  sensorMap,
  sensorList,
} from '../stores';
import { get } from 'svelte/store';
import { callMetaAPI } from './api';

export * from './signals';
export { formatAPITime, parseAPITime } from './utils';

function toStatsRegionKey(sensorKey, region) {
  return sensorKey + '_' + region;
}

function processMetaData(meta) {
  const timeMap = new Map();
  const statsMap = new Map();

  sensorList.forEach((sEntry) => {
    // need to change mean / std for counts
    if (sEntry.isCount) {
      loadCountSignal(sEntry, meta, timeMap, statsMap);
    } else {
      loadRegularSignal(sEntry, meta, timeMap, statsMap);
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

/**
 * @param {import('./fetchData').SensorEntry} sEntry
 */
function loadRegularSignal(sEntry, meta, timeMap, statsMap) {
  const matchedMeta = meta.epidata.find(
    (d) => d.data_source === sEntry.id && d.signal === sEntry.signal && d.time_type === 'day',
  );

  if (matchedMeta) {
    if (matchedMeta.max_time > yesterday) {
      matchedMeta.max_time = yesterday;
    }

    timeMap.set(sEntry.key, [matchedMeta.min_time, matchedMeta.max_time]);

    statsMap.set(sEntry.key, {
      mean: matchedMeta.mean_value,
      std: matchedMeta.stdev_value,
    });
    return;
  }
  // If no metadata, use information from sensors
  // Used for testing new data
  timeMap.set(sEntry.key, [sEntry.minTime, sEntry.maxTime]);
  statsMap.set(sEntry.key, {
    mean: sEntry.mean,
    std: sEntry.std,
  });
}

/**
 * @param {import('./fetchData').SensorEntry} sEntry
 */
function loadCountSignal(sEntry, meta, timeMap, statsMap) {
  const regions = sEntry.levels;

  const possibleMetaRows = meta.epidata.filter((d) => d.data_source === sEntry.id && d.time_type === 'day');

  regions.forEach((region) => {
    const statsKey = toStatsRegionKey(sEntry.key, region);

    const matchedMeta = possibleMetaRows.find((d) => d.signal === sEntry.signal && d.geo_type === region);

    if (matchedMeta) {
      if (matchedMeta.max_time > yesterday) {
        matchedMeta.max_time = yesterday;
      }

      timeMap.set(sEntry.key, [matchedMeta.min_time, matchedMeta.max_time]);

      statsMap.set(statsKey, {
        mean: matchedMeta.mean_value,
        std: matchedMeta.stdev_value,
      });
      return;
    }
    // If no metadata, use information from sensors
    // Used for testing new data
    timeMap.set(sEntry.key, [sEntry.minTime, sEntry.maxTime]);
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

  if (!sEntry.isCasesOrDeath) {
    return;
  }

  Object.keys(sEntry.casesOrDeathSignals).map((key) => {
    const signal = sEntry.casesOrDeathSignals[key];
    // compute stats for each sub signal also
    regions.forEach((region) => {
      const statsKey = toStatsRegionKey(sEntry.key, region) + `_${key}`;
      const matchedMeta = possibleMetaRows.find((d) => d.signal === signal && d.geo_type === region);

      if (!matchedMeta) {
        return;
      }

      if (matchedMeta.max_time > yesterday) {
        matchedMeta.max_time = yesterday;
      }

      timeMap.set(sEntry.key, [matchedMeta.min_time, matchedMeta.max_time]);

      statsMap.set(statsKey, {
        mean: matchedMeta.mean_value,
        std: matchedMeta.stdev_value,
      });
    });
  });
}

export function loadMetaData() {
  return callMetaAPI().then((meta) => processMetaData(meta));
}
