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
 * @property {[[number,number]]} lags
 */

/**
 * Generates R^2 metrics for lags between -28 and 28 days.
 *
 * For lags between 0 and 28 lag b backwards with respect to a.  For -28 to -1 lag a with
 * respect to b.
 *
 * For each lag, the input is a window of length(a)-28, such that the number of values at
 * each lag is the same.
 *
 * @param {Number[]} a
 * @param {Number[]} b
 */
function generateLags(a, b) {
  let lag = 28;
  let lags = [];
  let aWindow = a.slice(lag);
  let bWindow = b.slice(lag);

  for (let i = 0; i <= lag; i++) {
    let bLag = b.slice(lag - i, b.length - i);
    let model = linear(zip(aWindow, bLag));
    lags.push({ lag: i, r2: model.r2 });
  }

  for (let i = 1; i <= lag; i++) {
    let aLag = a.slice(lag - i, b.length - i);
    let model = linear(zip(aLag, bWindow));
    lags.push({ lag: -1 * i, r2: model.r2 });
  }
  return lags;
}

/**
 * Do a pair-wise combination of the elements from a and b arrays.
 * @param {Number[]} a
 * @param {Number[]} b
 */
function zip(a, b) {
  return a.map((x, i) => {
    return [x, b[i]];
  });
}

/**
 * Compute 28-day correlation metrics for a response variable given an explanatory variable.
 *
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

  let model = linear(zip(response_values, explanatory_values));
  let lags = generateLags(response_values, explanatory_values);
  let max = lags.reduce((acc, i) => {
    return i.r2 > acc.r2 ? i : acc;
  });

  return {
    r2At0: model.r2,
    lagAtMaxR2: max.lag,
    r2AtMaxR2: max.r2,
    lags: lags,
  };
}
