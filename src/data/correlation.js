import { linear } from 'regression';
import { zip } from '../util';

/**
 * @typedef {object} Lag
 * @property {number} lag
 * @property {number} r2
 * @property {number} slope y = slope * x + intercept
 * @property {number} intercept y = slope * x + intercept
 * @property {number} samples number of dates used for the regression line
 * @property {import('./fetchData').EpiDataRow[]} a
 * @property {import('./fetchData').EpiDataRow[]} b
 */

/**
 * @typedef {object} CorrelationMetric
 * @property {number} r2At0
 * @property {number} lagAtMaxR2
 * @property {number} r2AtMaxR2
 * @property {Lag} t0
 * @property {Lag} tMax
 * @property {Lag[]} lags
 */

/**
 * Use this many days of lag to compute correlation metrics
 * @type number
 */
const lag = 28;

/**
 *
 * @param {number} lag
 * @param {import('regression').Result} model
 * @return {Lag}
 */
function asLag(lag, model, a, b) {
  return {
    r2: model.r2,
    lag,
    samples: model.points.length,
    slope: model.equation[0],
    intercept: model.equation[1],
    a,
    b,
  };
}
/**
 * Generates R^2 metrics for lags between -28 and 28 days.
 *
 * For lags between 0 and 28 lag b backwards with respect to a.  For -28 to -1 lag a with
 * respect to b.
 *
 * For each lag, the input is a window of length(a)-28, such that the number of values at
 * each lag is the same.
 *
 * @template {{value: number}} T
 * @param {T[]} a
 * @param {T[]} b
 * @returns {Lag[]}
 */
function generateLags(a, b) {
  /**
   * @type {Lag[]}
   */
  const lags = [];

  const aValues = a.map((d) => d.value);
  const bValues = b.map((d) => d.value);

  const aWindow = a.slice(lag);
  const aWindowValues = aValues.slice(lag);
  const bWindow = b.slice(lag);
  const bWindowValues = bValues.slice(lag);

  for (let i = 0; i <= lag; i++) {
    const bLag = b.slice(lag - i, b.length - i);
    const bValuesLag = bValues.slice(lag - i, b.length - i);
    const model = linear(zip(aWindowValues, bValuesLag));
    lags.push(asLag(i, model, aWindow, bLag));
  }

  for (let i = 1; i <= lag; i++) {
    const aLag = a.slice(lag - i, b.length - i);
    const aValuesLag = aValues.slice(lag - i, b.length - i);
    const model = linear(zip(aValuesLag, bWindowValues));
    lags.push(asLag(-i, model, aLag, bWindow));
  }
  return lags;
}

/**
 * Do a pair-wise intersection of EpiDataRow by date.
 * @template {{time_value: number}} T
 * @param {T[]} a
 * @param {T[]} b
 * @returns {[T, T][]}
 */
function intersectEpiDataRow(a, b) {
  const aLength = a.length;
  const bLength = b.length;
  let aIndex = 0;
  let bIndex = 0;

  const intersection = [];

  while (aIndex < aLength && bIndex < bLength) {
    if (a[aIndex].time_value < b[bIndex].time_value) {
      aIndex++;
    } else if (a[aIndex].time_value > b[bIndex].time_value) {
      bIndex++;
    } else {
      intersection.push([a[aIndex], b[bIndex]]);
      aIndex++;
      bIndex++;
    }
  }

  return intersection;
}

/**
 * Compute 28-day correlation metrics for a response variable given an explanatory variable.
 *
 * @param {import('./fetchData').EpiDataRow[]} response
 * @param {import('./fetchData').EpiDataRow[]} explanatory
 * @returns {CorrelationMetric}
 */
export function generateCorrelationMetrics(response, explanatory) {
  const zippedEpiData = intersectEpiDataRow(response, explanatory);
  if (zippedEpiData.length < lag * 2) {
    throw new Error(
      `Not enough data: There are only ${zippedEpiData.length} dates in both indicators in this time range.`,
    );
  }
  const responseValues = zippedEpiData.map((row) => row[0]);
  const explanatoryValues = zippedEpiData.map((row) => row[1]);

  const lags = generateLags(responseValues, explanatoryValues);
  const max = lags.reduce((acc, i) => {
    return i.r2 > acc.r2 ? i : acc;
  });

  const lagAtZero = lags.find((l) => l.lag == 0);

  return {
    r2At0: lagAtZero.r2,
    lagAtMaxR2: max.lag,
    r2AtMaxR2: max.r2,
    tMax: max,
    t0: lagAtZero,
    lags: lags,
  };
}
