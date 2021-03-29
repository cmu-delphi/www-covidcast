import { times, currentDate, stats, currentSensor, currentLevel, MAGIC_START_DATE } from '../stores';
import { sensorList, sensorMap, levels, yesterday, regularSignalMetaDataGeoTypeCandidates } from '../stores/constants';
import { get } from 'svelte/store';
import { callMetaAPI } from './api';
import { parseAPITime, formatAPITime } from './utils';
import { timeDay } from 'd3-time';

export * from './signals';
export * from './fetchData';
export { formatAPITime, parseAPITime } from './utils';
export * from './annotations';

function toStatsRegionKey(sensorKey: string, region: string) {
  return sensorKey + '_' + region;
}

function processMetaData(meta) {
  const timeMap = new Map();
  const statsMap = new Map();

  sensorList.forEach((sEntry) => {
    // need to change mean / std for counts
    if (sEntry.isCount || sEntry.isCasesOrDeath) {
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
    date = formatAPITime(timeDay.offset(parseAPITime(timeMap.get(sensor)[1]), -2));
    currentDate.set(date);
  }

  return {
    level: l,
    date,
  };
}

function updateTimeMap(key, matchedMeta, timeMap) {
  timeMap.set(key, [matchedMeta.min_time, matchedMeta.max_time > yesterday ? yesterday : matchedMeta.max_time]);
}
function updateStatsMap(key, matchedMeta, statsMap) {
  statsMap.set(key, {
    max: matchedMeta.max_value,
    mean: matchedMeta.mean_value,
    std: matchedMeta.stdev_value,
  });
}
/**
 * @param {import('./fetchData').SensorEntry} sEntry
 */
function loadRegularSignal(sEntry, meta, timeMap, statsMap) {
  // find the matching meta data by looping through the candidates and fallback to the first one
  const baseFilter = (d) =>
    d.data_source === sEntry.id && d.signal === sEntry.signal && (!d.time_type || d.time_type === 'day');

  const byGeoTypePriority = (a, b) => {
    // sort by geo types but consider their importance for the matching
    const aIndex = regularSignalMetaDataGeoTypeCandidates.indexOf(a.geo_type);
    const bIndex = regularSignalMetaDataGeoTypeCandidates.indexOf(b.geo_type);
    if (aIndex === bIndex) {
      return a.geo_type.localeCompare(b.geo_type);
    }
    if (aIndex < 0) {
      // missing is bigger
      return 1;
    }
    if (bIndex < 0) {
      return -1;
    }
    return aIndex - bIndex;
  };

  const candidates = meta.epidata.filter(baseFilter).sort(byGeoTypePriority);
  const matchedMeta = candidates[0];

  if (matchedMeta) {
    updateTimeMap(sEntry.key, matchedMeta, timeMap);
    updateStatsMap(sEntry.key, matchedMeta, statsMap);
    return;
  }
  // If no metadata, use information from sensors
  // Used for testing new data
  timeMap.set(sEntry.key, [sEntry.minTime, sEntry.maxTime]);
  statsMap.set(sEntry.key, {
    max: sEntry.max,
    mean: sEntry.mean,
    std: sEntry.std,
  });
}

/**
 * @param {import('./fetchData').SensorEntry} sEntry
 */
function loadCountSignal(sEntry, meta, timeMap, statsMap) {
  const possibleMetaRows = meta.epidata.filter(
    (d) => d.data_source === sEntry.id && (!d.time_type || d.time_type === 'day'),
  );

  sEntry.levels.forEach((region) => {
    const statsKey = toStatsRegionKey(sEntry.key, region);

    const matchedMeta = possibleMetaRows.find((d) => d.signal === sEntry.signal && d.geo_type === region);

    if (matchedMeta) {
      updateTimeMap(sEntry.key, matchedMeta, timeMap);
      updateStatsMap(statsKey, matchedMeta, statsMap);
      return;
    }
    // If no metadata, use information from sensors
    // Used for testing new data
    timeMap.set(sEntry.key, [sEntry.minTime, sEntry.maxTime]);
    if (region === 'county') {
      statsMap.set(statsKey, {
        max: sEntry.county_max,
        mean: sEntry.county_mean,
        std: sEntry.county_std,
      });
    } else if (region === 'msa') {
      statsMap.set(statsKey, {
        max: sEntry.msa_max,
        mean: sEntry.msa_mean,
        std: sEntry.msa_std,
      });
    } else if (region === 'hrr') {
      statsMap.set(statsKey, {
        max: sEntry.hrr_max,
        mean: sEntry.hrr_mean,
        std: sEntry.hrr_std,
      });
    } else {
      statsMap.set(statsKey, {
        max: sEntry.state_max,
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

    const matchedMeta = possibleMetaRows.find((d) => d.signal === signal);
    const statsKey = `${sEntry.key}_${key}`;
    if (matchedMeta) {
      updateTimeMap(sEntry.key, matchedMeta, timeMap);
      updateStatsMap(statsKey, matchedMeta, statsMap);
    }

    // compute stats for each sub signal also
    sEntry.levels.forEach((region) => {
      const statsKey = toStatsRegionKey(sEntry.key, region) + `_${key}`;
      const matchedMeta = possibleMetaRows.find((d) => d.signal === signal && d.geo_type === region);

      if (matchedMeta) {
        updateStatsMap(statsKey, matchedMeta, statsMap);
      }
    });
  });
}

/**
 *
 * @param {import('../stores/constants').SensorEntry[]} sensors
 */
export function loadMetaData(sensors) {
  const custom = sensors.filter((d) => d.meta).map((d) => d.meta(d.id, d.signal));
  const remoteSignals = sensors.filter((d) => !d.meta);
  return Promise.all([
    callMetaAPI(
      remoteSignals,
      ['min_time', 'max_time', 'max_value', 'mean_value', 'stdev_value', 'signal', 'geo_type', 'data_source'],
      {
        time_types: 'day',
        geo_types: [...new Set(levels)],
      },
    ),
    ...custom,
  ]).then((metas) => {
    const meta = metas[0];
    if (!Array.isArray(meta.epidata)) {
      // bug in the API
      meta.epidata = [...Object.values(meta.epidata)];
    }
    meta.epidata.push(...metas.slice(1).flat(2));
    return processMetaData(meta);
  });
}
