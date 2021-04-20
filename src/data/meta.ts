import { times, currentDate, stats, currentSensor, currentLevel, MAGIC_START_DATE } from '../stores';
import {
  sensorList,
  sensorMap,
  levels,
  yesterday,
  regularSignalMetaDataGeoTypeCandidates,
  SensorEntry,
  EpiDataCasesOrDeathValues,
} from '../stores/constants';
import { get } from 'svelte/store';
import { callMetaAPI, EpiDataResponse } from './api';
import { parseAPITime, formatAPITime } from './utils';
import { timeDay } from 'd3-time';
import type { RegionLevel } from './regions';

function toStatsRegionKey(sensorKey: string, region: string) {
  return sensorKey + '_' + region;
}

export interface MetaEntry {
  min_time: number;
  max_time: number;
  max_value: number;
  stdev_value: number;
  mean_value: number;

  data_source: string;
  signal: string;
  time_type: string;
  geo_type: RegionLevel;
}

function processMetaData(meta: EpiDataResponse<MetaEntry>): { level: RegionLevel; date: string } {
  const timeMap = new Map<string, [number, number]>();
  const statsMap = new Map<string, { max: number; mean: number; std: number }>();

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
  const sensorInfo = sensorMap.get(sensor);
  if (sensorInfo && !sensorInfo.levels.includes(l)) {
    l = sensorInfo.levels[0];
    currentLevel.set(l);
  }

  let date = get(currentDate);
  // Magic number of default date - if no URL params, use max date
  // available
  const timeEntry = timeMap.get(sensor);
  if (date === MAGIC_START_DATE && timeEntry != null) {
    date = formatAPITime(timeDay.offset(parseAPITime(timeEntry[1]), -2));
    currentDate.set(date);
  }

  return {
    level: l,
    date,
  };
}

function updateTimeMap(key: string, matchedMeta: MetaEntry, timeMap: Map<string, [number, number]>) {
  timeMap.set(key, [matchedMeta.min_time, matchedMeta.max_time > yesterday ? yesterday : matchedMeta.max_time]);
}
function updateStatsMap(
  key: string,
  matchedMeta: MetaEntry,
  statsMap: Map<string, { max: number; mean: number; std: number }>,
) {
  statsMap.set(key, {
    max: matchedMeta.max_value,
    mean: matchedMeta.mean_value,
    std: matchedMeta.stdev_value,
  });
}

interface LocalSensorEntry {
  minTime: number;
  maxTime: number;

  max: number;
  mean: number;
  std: number;

  county_max: number;
  county_mean: number;
  county_std: number;

  msa_max: number;
  msa_mean: number;
  msa_std: number;

  state_max: number;
  state_mean: number;
  state_std: number;

  hrr_max: number;
  hrr_mean: number;
  hrr_std: number;
}

function loadRegularSignal(
  sEntry: SensorEntry,
  meta: EpiDataResponse<MetaEntry>,
  timeMap: Map<string, [number, number]>,
  statsMap: Map<string, { mean: number; max: number; std: number }>,
) {
  // find the matching meta data by looping through the candidates and fallback to the first one
  const baseFilter = (d: MetaEntry) =>
    d.data_source === sEntry.id && d.signal === sEntry.signal && (!d.time_type || d.time_type === 'day');

  const byGeoTypePriority = (a: MetaEntry, b: MetaEntry) => {
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
  const localEntry = (sEntry as unknown) as LocalSensorEntry;
  // If no metadata, use information from sensors
  // Used for testing new data
  timeMap.set(sEntry.key, [localEntry.minTime, localEntry.maxTime]);
  statsMap.set(sEntry.key, {
    max: localEntry.max,
    mean: localEntry.mean,
    std: localEntry.std,
  });
}

function loadCountSignal(
  sEntry: SensorEntry,
  meta: EpiDataResponse<MetaEntry>,
  timeMap: Map<string, [number, number]>,
  statsMap: Map<string, { mean: number; max: number; std: number }>,
) {
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
    const localEntry = (sEntry as unknown) as LocalSensorEntry;
    // If no metadata, use information from sensors
    // Used for testing new data
    timeMap.set(sEntry.key, [localEntry.minTime, localEntry.maxTime]);
    if (region === 'county') {
      statsMap.set(statsKey, {
        max: localEntry.county_max,
        mean: localEntry.county_mean,
        std: localEntry.county_std,
      });
    } else if (region === 'msa') {
      statsMap.set(statsKey, {
        max: localEntry.msa_max,
        mean: localEntry.msa_mean,
        std: localEntry.msa_std,
      });
    } else if (region === 'hrr') {
      statsMap.set(statsKey, {
        max: localEntry.hrr_max,
        mean: localEntry.hrr_mean,
        std: localEntry.hrr_std,
      });
    } else {
      statsMap.set(statsKey, {
        max: localEntry.state_max,
        mean: localEntry.state_mean,
        std: localEntry.state_std,
      });
    }
  });

  if (!sEntry.isCasesOrDeath) {
    return;
  }

  Object.keys(sEntry.casesOrDeathSignals).map((key) => {
    const signal = sEntry.casesOrDeathSignals[key as keyof EpiDataCasesOrDeathValues];

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

export function loadMetaData(sensors: SensorEntry[]): Promise<ReturnType<typeof processMetaData>> {
  return callMetaAPI<MetaEntry>(
    sensors,
    ['min_time', 'max_time', 'max_value', 'mean_value', 'stdev_value', 'signal', 'geo_type', 'data_source'],
    {
      time_types: 'day',
      geo_types: [...new Set(levels as string[])].join(','),
    },
  ).then((meta) => {
    if (!Array.isArray(meta.epidata)) {
      // bug in the API
      meta.epidata = [...Object.values(meta.epidata)] as MetaEntry[];
    }
    return processMetaData(meta);
  });
}
