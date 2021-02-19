import { fetchData, formatAPITime } from '../../data';
import { nationInfo } from '../../maps';
import { currentRegion } from '../../stores';
/**
 * @typedef {object} Params
 * @property {import('../../maps').NameInfo} region
 * @property {Date} date
 * @property {number} timeValue
 * @property {(import('../../maps').NameInfo) => void} setRegion
 * @property {(sensor: SensorEntry, level: string, geo: string | string[]) => Promise<EpiDataRow[]>} fetchMultiRegions
 */

export function toTimeValue(date) {
  return Number.parseInt(formatAPITime(date), 10);
}
/**
 * @param {Date} date
 * @param {import("../../data").EpiDataRow[]} data
 */
export function findDateRow(date, data) {
  const apiDate = toTimeValue(date);
  return data.find((d) => d.time_value === apiDate);
}

export function asParams(sensor, region, date) {
  const cache = new Map();
  const timeValue = toTimeValue(Date);
  return {
    sensor,
    region: region || nationInfo,
    date,
    timeValue,
    setRegion: (region) => {
      currentRegion.set(region.propertyId);
    },
    fetchMultiRegions(sensorToLoad, level, geo) {
      const key = `${level}:${geo}`;
      if (sensor === sensorToLoad && cache.has(key)) {
        return cache.get(key);
      }
      const r = fetchData(
        sensorToLoad,
        level,
        geo,
        date,
        {
          time_value: timeValue,
        },
        {
          multiValues: false,
        },
      );
      if (sensor === sensorToLoad) {
        cache.set(key, r);
      }
      return r;
    },
  };
}
