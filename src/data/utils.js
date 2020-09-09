// combining json with same geolocations but different value properties

import { timeDay } from 'd3-time';
import { timeParse, timeFormat } from 'd3-time-format';

// json1 value is 7 day average, json2 value is single count
/**
 *
 * @param {import('./fetchData').EpiDataRow[][]} data
 * @param {string[]} keys
 */
export function combineSignals(data, keys) {
  const ref = data[0];

  const map = new Map(ref.map((d) => [`${d.geo_value}@${d.time_value}`, d]));
  data.forEach((rows, i) => {
    const key = keys[i];
    for (const d of rows) {
      const entry = map.get(`${d.geo_value}@${d.time_value}`);
      if (entry) {
        entry[key] = d.value;
      }
    }
  });
  return ref;
}

export function checkWIP(signalName, otherSignal) {
  if (signalName.match(/wip/)) {
    return 'wip_' + otherSignal.replace('incidence', 'incid');
  }
  return otherSignal;
}

const parseAPITimeParser = timeParse('%Y%m%d');

export function parseAPITime(v) {
  return timeDay(parseAPITimeParser(v));
}
/**
 * @type {(v: Date) => string}
 */
export const formatAPITime = timeFormat('%Y%m%d');
