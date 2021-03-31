// combining json with same geolocations but different value properties

import { timeDay } from 'd3-time';
import { timeParse, timeFormat } from 'd3-time-format';
import { linear } from 'regression';
import { zip } from '../util';
import type { EpiDataRow } from './fetchData';

// json1 value is 7 day average, json2 value is single count
/**
 *
 * @param {import('./fetchData').EpiDataRow[][]} data
 * @param {string[]} keys
 */
export function combineSignals<T extends Record<string, number>>(
  data: EpiDataRow[][],
  ref: EpiDataRow[],
  keys: (keyof T)[],
  toKey = (d: EpiDataRow): string => `${String(d.geo_value).toLowerCase()}@${d.time_value}`,
  factor = 1,
): (EpiDataRow & T)[] {
  const map = new Map(ref.map((d) => [toKey(d), d]));
  data.forEach((rows, i) => {
    const key = keys[i];
    for (const d of rows || []) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any
      const entry = (map.get(toKey(d)) as unknown) as Record<string, number>;
      if (entry) {
        entry[key as string] = d.value * factor;
      }
    }
  });
  return ref as (EpiDataRow & T)[];
}

const parseAPITimeParser = timeParse('%Y%m%d');

export function parseAPITime(v: number | string): Date {
  return timeDay(parseAPITimeParser(String(v))!);
}
/**
 * @type {(v: Date) => string}
 */
export const formatAPITime = timeFormat('%Y%m%d');

export interface Lag {
  lag: number;
  r2: number;
}

export interface CorrelationMetric {
  r2At0: number;
  lagAtMaxR2: number;
  r2AtMaxR2: number;
  lags: Lag[];
}

/**
 * Use this many days of lag to compute correlation metrics
 */
const lag = 28;

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
function generateLags(a: readonly number[], b: readonly number[]): Lag[] {
  const lags: Lag[] = [];
  const aWindow = a.slice(lag);
  const bWindow = b.slice(lag);

  for (let i = 0; i <= lag; i++) {
    const bLag = b.slice(lag - i, b.length - i);
    const model = linear(zip(aWindow, bLag));
    lags.push({ lag: i, r2: model.r2 });
  }

  for (let i = 1; i <= lag; i++) {
    const aLag = a.slice(lag - i, b.length - i);
    const model = linear(zip(aLag, bWindow));
    lags.push({ lag: -1 * i, r2: model.r2 });
  }
  return lags;
}

/**
 * Do a pair-wise intersection of EpiDataRow by date.
 */
function intersectEpiDataRow(a: readonly EpiDataRow[], b: readonly EpiDataRow[]): [number, number][] {
  const aLength = a.length;
  const bLength = b.length;
  let aIndex = 0;
  let bIndex = 0;
  const intersection: [number, number][] = [];

  while (aIndex < aLength && bIndex < bLength) {
    if (a[aIndex].time_value < b[bIndex].time_value) {
      aIndex++;
    } else if (a[aIndex].time_value > b[bIndex].time_value) {
      bIndex++;
    } else {
      intersection.push([a[aIndex].value, b[bIndex].value]);
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
export function generateCorrelationMetrics(
  response: readonly EpiDataRow[],
  explanatory: readonly EpiDataRow[],
): CorrelationMetric {
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

  const lagAtZero = lags.filter((l) => l.lag == 0)[0];

  return {
    r2At0: lagAtZero.r2,
    lagAtMaxR2: max.lag,
    r2AtMaxR2: max.r2,
    lags: lags,
  };
}
