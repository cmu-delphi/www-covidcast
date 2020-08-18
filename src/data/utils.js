// combining json with same geolocations but different value properties

import { timeParse, timeFormat } from 'd3-time-format';

// json1 value is 7 day average, json2 value is single count
/**
 *
 * @param {import('./fetchData').EpiDataRow[][]} data
 * @param {string[]} keys
 */
export function combineSignals(data, keys) {
  const ref = data[0];

  return ref.map((ref, i) => {
    keys.forEach((key, j) => {
      ref[key] = data[j].length > i ? Math.max(0, data[j][i].value) : 0;
    });
    return ref;
  });
}

export function checkWIP(signalName, otherSignal) {
  if (signalName.match(/wip/)) {
    return 'wip_' + otherSignal.replace('incidence', 'incid');
  }
  return otherSignal;
}

/**
 * @type {(v: string) => Date}
 */
export const parseAPITime = timeParse('%Y%m%d');
/**
 * @type {(v: Date) => string}
 */
export const formatAPITime = timeFormat('%Y%m%d');
