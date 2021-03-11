// combining json with same geolocations but different value properties

import { timeDay } from 'd3-time';
import { timeParse, timeFormat } from 'd3-time-format';

// json1 value is 7 day average, json2 value is single count
/**
 *
 * @param {import('./fetchData').EpiDataRow[][]} data
 * @param {string[]} keys
 */
export function combineSignals(
  data,
  ref,
  keys,
  toKey = (d) => `${String(d.geo_value).toLowerCase()}@${d.time_value}`,
  factor = 1,
) {
  const map = new Map(ref.map((d) => [toKey(d), d]));
  data.forEach((rows, i) => {
    const key = keys[i];
    for (const d of rows || []) {
      const entry = map.get(toKey(d));
      if (entry) {
        entry[key] = d.value * factor;
      }
    }
  });
  return ref;
}

const parseAPITimeParser = timeParse('%Y%m%d');

export function parseAPITime(v) {
  return timeDay(parseAPITimeParser(v));
}
/**
 * @type {(v: Date) => string}
 */
export const formatAPITime = timeFormat('%Y%m%d');
