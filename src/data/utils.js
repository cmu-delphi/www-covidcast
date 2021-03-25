// combining json with same geolocations but different value properties

import { timeDay } from 'd3-time';
import { timeParse, timeFormat } from 'd3-time-format';
import { linear } from 'regression';

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

/**
 * @typedef {object} CorrelationMetric
 * @property {number} r2At0
 * @property {number} lagAtMaxR2
 * @property {number} r2AtMaxR2
 */

/**
 * @param {import('./fetchData').EpiDataRow[]} response
 * @param {import('./fetchData').EpiDataRow[]} explanatory
 * @param {CorrelationMetric} metric
 */
export function generateCorrelationMetrics(response, explanatory) {
  let response_values = response.map((row) => {
    return row.value;
  });

  let explanatory_values = explanatory.map((row) => {
    return row.value;
  });

  let zipped_values = response_values.map((x, i) => {
    return [explanatory_values[i], x];
  });
  console.log(zipped_values);
  let model = linear(zipped_values);
  console.log(JSON.stringify(model));
  return {
    r2At0: model.r2,
    lagAtMaxR2: 0,
    r2AtMaxR2: model.r2,
  };
}
