// combining json with same geolocations but different value properties

import { timeDay } from 'd3-time';
import { timeParse, timeFormat } from 'd3-time-format';
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

export function toTimeValue(date: Date): number {
  return Number.parseInt(formatAPITime(date), 10);
}
