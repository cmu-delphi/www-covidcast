// combining json with same geolocations but different value properties

import { timeParse, timeFormat } from 'd3-time-format';

// json1 value is 7 day average, json2 value is single count
export function combineAverageWithCount(json1, json2) {
  const data1 = json1.epidata;
  const data2 = json2.epidata;

  return data1.map((d1, i) => {
    const d2 = data2[i];
    const avg = Math.max(0, d1.value);
    const count = Math.max(0, d2.value);
    d1.avg = avg;
    d1.count = count;
    delete d1.value;
    return d1;
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
