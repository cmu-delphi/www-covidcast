import { linear, Result } from 'regression';
import { zip } from '../util';
import type { EpiDataRow } from './fetchData';

export interface Lag<T = EpiDataRow> {
  lag: number;
  r2: number;

  /**
   * y = slope * x + intercept
   */
  slope: number;
  /**
   * y = slope * x + intercept
   */
  intercept: number;

  /**
   * number of dates used for the regression line
   */
  samples: number;

  a: T[];
  b: T[];
}

export interface CorrelationMetric<T = EpiDataRow> {
  r2At0: number;
  lagAtMaxR2: number;
  r2AtMaxR2: number;
  t0?: Lag<T>;
  tMax?: Lag<T>;
  lags: Lag<T>[];
}

/**
 * Use this many days of lag to compute correlation metrics
 */
const lag = 28;

function asLag<T>(lag: number, model: Result, a: T[], b: T[]): Lag<T> {
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
 */
function generateLags<T extends { value: number }>(a: readonly T[], b: readonly T[]): Lag<T>[] {
  const lags: Lag<T>[] = [];

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
 */
function intersectEpiDataRow<T extends { time_value: number; value: number }>(
  a: readonly T[],
  b: readonly T[],
): [T, T][] {
  const aLength = a.length;
  const bLength = b.length;
  let aIndex = 0;
  let bIndex = 0;

  const intersection: [T, T][] = [];

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
 */
export function generateCorrelationMetrics<T extends { time_value: number; value: number }>(
  response: readonly T[],
  explanatory: readonly T[],
): CorrelationMetric<T> {
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
