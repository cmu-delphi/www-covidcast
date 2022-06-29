import { callAPI } from './api';
import type { EpiDataJSONRow } from './api';
import { timeDay, timeWeek } from 'd3-time';
import { parseAPIDateAndWeek, toTimeValue } from './utils';
import { getInfoByName } from './regions';
import type { RegionInfo } from './regions';
import { TimeFrame } from './TimeFrame';
import { SourceSignalPair, GeoPair, TimePair, START_TIME_RANGE, END_TIME_RANGE } from './apimodel';
import { EpiWeek } from './EpiWeek';

export interface EpiDataRow extends EpiDataJSONRow {
  date_value: Date;
  week_value: EpiWeek;
}

export function parseData(
  d: EpiDataJSONRow[],
  mixinData: Partial<EpiDataRow> = {},
  factor: number | ((v: EpiDataRow) => number) = 1,
): EpiDataRow[] {
  if (!d || d.length === 0) {
    return [];
  }
  const data = d as EpiDataRow[];

  for (const row of data) {
    Object.assign(row, mixinData);
    if (row.time_value == null) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
      (row as any).date_value = null;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
      (row as any).week_value = null;
      continue;
    }
    if (!(row.date_value instanceof Date)) {
      const { date: d, week: w } = parseAPIDateAndWeek(row.time_value);
      row.date_value = d;
      row.week_value = w;
    } else if (!(row.week_value instanceof EpiWeek)) {
      row.week_value = EpiWeek.fromDate(row.date_value);
    }
    row.value = row.value * (typeof factor === 'function' ? factor(row) : factor);
  }
  // sort by date
  data.sort((a, b) => {
    if (a.time_value === b.time_value) {
      return a.value - b.value;
    }
    return a.time_value < b.time_value ? -1 : 1;
  });
  return data;
}

export interface NationSummarySamples {
  minDate: Date | null;
  maxDate: Date | null;
  totalSampleSize: number;
  averageSampleSize: number;
}

export async function fetchSampleSizesNationSummary(dataSensor: {
  id: string;
  signal: string;
}): Promise<NationSummarySamples> {
  const data = await callAPI(
    'day',
    new SourceSignalPair(dataSensor.id, dataSensor.signal),
    new GeoPair('nation', 'us'),
    new TimePair('day', new TimeFrame(START_TIME_RANGE, END_TIME_RANGE)),
    ['time_value', 'sample_size'],
  ).then((r) => parseData(r, {}, 1));

  const sum = data.reduce((acc, v) => (v.sample_size != null ? acc + v.sample_size : acc), 0);
  return {
    // parse data produces sorted by date
    minDate: data.length > 0 ? data[0].date_value : null,
    maxDate: data.length > 0 ? data[data.length - 1].date_value : null,
    totalSampleSize: sum,
    averageSampleSize: sum / data.length,
  };
}

function createCopy<T extends EpiDataRow = EpiDataRow>(row: T, date: Date, granularity: 'day' | 'week'): T {
  const week = EpiWeek.fromDate(date);
  const copy = Object.assign({}, row, {
    date_value: date,
    week_value: week,
    time_value: granularity == 'day' ? toTimeValue(date) : week.format(),
    value: null,
    stderr: null,
    sample_size: null,
  });
  return copy;
}

/**
 * fit the data to be in the start/end date range
 */
export function fitRange<T extends EpiDataRow = EpiDataRow>(
  rows: T[],
  startDate: Date,
  endDate: Date,
  granularity: 'day' | 'week',
): T[] {
  if (rows.length === 0) {
    return rows;
  }
  if (rows[0].date_value != null && rows[0].date_value > startDate) {
    // inject a min
    rows.unshift(createCopy(rows[0], startDate, granularity));
  }
  if (rows[rows.length - 1].date_value != null && rows[rows.length - 1].date_value < endDate) {
    // inject a max
    rows.push(createCopy(rows[rows.length - 1], endDate, granularity));
  }
  return rows;
}

/**
 * add missing rows per date within this given date rows
 */
export function addMissing<T extends EpiDataRow = EpiDataRow>(rows: T[], granularity: 'day' | 'week'): T[] {
  if (rows.length < 2) {
    return rows;
  }
  const min = rows[0].date_value;
  const max = rows[rows.length - 1].date_value;
  const template = rows[0];
  const base = rows.slice();
  const ranger = granularity == 'week' ? timeWeek : timeDay;
  const range = ranger.range(min, ranger.offset(max, 1), 1);
  if (range.length === rows.length) {
    // full
    return rows;
  }
  const imputedRows = range.map((date) => {
    if (base.length > 0 && base[0].date_value.getTime() <= date.getTime()) {
      return base.shift()!;
    }
    // create an entry
    return createCopy(template, date, granularity);
  });
  return imputedRows;
}

export function addNameInfos(rows: EpiDataRow[]): (EpiDataRow & RegionInfo)[] {
  for (const row of rows) {
    Object.assign(row, getInfoByName(row.geo_value, row.geo_type));
  }
  return rows as (EpiDataRow & RegionInfo)[];
}

function avg(rows: EpiDataRow[], field: 'value' | 'stderr' | 'sample_size') {
  let valid = 0;
  const sum = rows.reduce((acc, v) => {
    const vi = v[field];
    if (vi == null || Number.isNaN(vi)) {
      return acc;
    }
    valid++;
    return acc + vi;
  }, 0);
  if (sum == null || Number.isNaN(sum) || valid === 0) {
    return {
      avg: null,
      valid: 0,
    };
  }
  return {
    avg: sum / valid,
    valid,
  };
}
/**
 * group by date and averages its values
 */
export function averageByDate(rows: EpiDataRow[], mixin: Partial<EpiDataRow> = {}): (EpiDataRow & { valid: number })[] {
  // average by date
  const byDate = new Map<number | string, EpiDataRow[]>();
  for (const row of rows) {
    const key = row.time_value;
    if (byDate.has(key)) {
      byDate.get(key)?.push(row);
    } else {
      byDate.set(key, [row]);
    }
  }
  return Array.from(byDate.values(), (rows) => {
    const v = avg(rows, 'value')!;
    const r: EpiDataRow & { valid: number } = {
      ...rows[0],
      ...mixin,
      value: v.avg!,
      valid: v.valid,
      stderr: avg(rows, 'stderr').avg!,
      sample_size: avg(rows, 'sample_size').avg!,
    };
    return r;
  }).sort((a, b) => a.time_value - b.time_value);
}
