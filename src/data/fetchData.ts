import {
  callAPI,
  callTreeAPI,
  END_TIME_RANGE,
  EpiDataJSONRow,
  EpiDataResponse,
  EpiDataTreeResponse,
  GeoPair,
  SourceSignalPair,
  START_TIME_RANGE,
  TimePair,
} from './api';
import { timeDay } from 'd3-time';
import { parseAPITime, formatAPITime, combineSignals } from './utils';
import { EpiDataCasesOrDeathValues, EPIDATA_CASES_OR_DEATH_VALUES } from '../stores/constants';
import { getInfoByName } from './regions';
import type { RegionInfo, RegionLevel } from './regions';
import { TimeFrame } from './TimeFrame';

export interface DataSensor {
  id: string;
  signal: string;
  isCasesOrDeath?: boolean;
  casesOrDeathSignals?: Record<string, string>;
}

// * @property {number} issue
// * @property {number} lag
// * @property {number | null} sample_size

export interface EpiDataRow extends EpiDataJSONRow {
  date_value: Date;
}

export type CasesOrDeathEpiDataRow = EpiDataRow & EpiDataCasesOrDeathValues;

/**
 * @param {Partial<EpiDataRow>} mixinValues
 */
function computeTransferFields(mixinValues = {}, advanced = false, transferSignal = false): (keyof EpiDataJSONRow)[] {
  const toRemove = Object.keys(mixinValues);
  const allFields: (keyof EpiDataJSONRow)[] = ['geo_value', 'stderr', 'time_value', 'value'];
  if (advanced) {
    allFields.push('issue', 'sample_size');
  }
  if (transferSignal) {
    allFields.push('signal');
  }
  return allFields.filter((d) => !toRemove.includes(d));
}

/**
 * @typedef {EpiDataRow & EpiDataCasesOrDeathValues} EpiDataCasesOrDeathRow
 */

export function parseData(
  d: EpiDataResponse<EpiDataJSONRow>,
  mixinData: Partial<EpiDataRow> = {},
  factor: number | ((v: EpiDataRow) => number) = 1,
): EpiDataRow[] {
  if (d.result < 0 || d.message.includes('no results')) {
    return [];
  }
  const data = (d.epidata || []) as EpiDataRow[];

  for (const row of data) {
    Object.assign(row, mixinData);
    if (row.time_value == null) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
      (row as any).date_value = null;
      continue;
    }
    row.date_value = parseAPITime(row.time_value.toString());
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

function deriveCombineKey(mixinData: Partial<EpiDataRow> = {}) {
  let combineKey = (d: EpiDataRow) => `${d.geo_value}@${d.time_value}`;
  // part of key
  if (mixinData.time_value != null) {
    combineKey = (d: EpiDataRow) => `${d.geo_value}`;
  } else if (mixinData.geo_value == null) {
    combineKey = (d: EpiDataRow) => `${d.time_value}`;
  }
  return combineKey;
}

function parseMultipleTreeData(
  d: EpiDataTreeResponse<EpiDataJSONRow>,
  signals: string[],
  defaultSignalIndex: number,
  mixinData: Partial<EpiDataRow> = {},
  factor = 1,
): EpiDataRow[] {
  if (d.result < 0 || d.message.includes('no results')) {
    return [];
  }
  const tree = (d.epidata || [])[0];
  if (!tree || (Array.isArray(tree) && tree.length === 0)) {
    return parseData({ ...d, epidata: [] }, mixinData, factor);
  }
  const split = signals.map((k) => tree[k] as EpiDataRow[]);
  const ref = split[defaultSignalIndex];
  const combined = combineSignals(split, ref, EPIDATA_CASES_OR_DEATH_VALUES, deriveCombineKey(mixinData), factor);
  return parseData(
    {
      ...d,
      epidata: combined,
    },
    mixinData,
    factor,
  );
}

function parseMultipleSeparateData(
  dataArr: EpiDataResponse<EpiDataJSONRow>[],
  defaultSignalIndex: number,
  mixinData: Partial<EpiDataRow> = {},
  factor = 1,
): EpiDataRow[] {
  if (dataArr.length === 0 || dataArr[0].result < 0 || dataArr[0].message.includes('no results')) {
    return [];
  }
  const data = dataArr.map((d) => (d.epidata || []) as EpiDataRow[]);
  const ref = data[defaultSignalIndex];
  const combined = combineSignals(data, ref, EPIDATA_CASES_OR_DEATH_VALUES, deriveCombineKey(mixinData), factor);
  return parseData(
    {
      ...dataArr[0],
      epidata: combined,
    },
    mixinData,
    factor,
  );
}

export interface FetchDataOptions {
  advanced?: boolean;
  /**
   * @default true
   */
  multiValues?: boolean;
  transferSignal?: boolean;
  factor?: number;
}

export function fetchData(
  dataSensor: DataSensor,
  level: RegionLevel,
  region: '*' | string | null | undefined,
  date: Date | '*' | TimeFrame,
  mixinValues: Partial<EpiDataRow> = {},
  { advanced = false, multiValues = true, transferSignal = false, factor = 1 }: FetchDataOptions = {},
): Promise<EpiDataRow[]> {
  if (!region) {
    return Promise.resolve([] as EpiDataRow[]);
  }
  mixinValues.time_type = 'day'; // inject time_type
  mixinValues.geo_type = level; // inject geo_type
  mixinValues.source = dataSensor.id;

  const transferFields = computeTransferFields(mixinValues, advanced, transferSignal);
  function fetchSeparate(defaultSignalIndex: number) {
    const extraDataFields: (keyof EpiDataJSONRow)[] = ['value'];
    // part of key
    if (mixinValues.time_value == null) {
      extraDataFields.push('time_value');
    }
    if (mixinValues.geo_value == null) {
      extraDataFields.push('geo_value');
    }
    return Promise.all(
      EPIDATA_CASES_OR_DEATH_VALUES.map((k, i) =>
        callAPI(
          new SourceSignalPair(dataSensor.id, dataSensor.casesOrDeathSignals![k]!),
          new GeoPair(level, region!),
          new TimePair('day', date),
          i === 0 ? transferFields : extraDataFields,
        ),
      ),
    ).then((d) => parseMultipleSeparateData(d, defaultSignalIndex, mixinValues, factor));
  }

  if (dataSensor.isCasesOrDeath && multiValues) {
    const signals = EPIDATA_CASES_OR_DEATH_VALUES.map((k) => dataSensor.casesOrDeathSignals![k]);
    const defaultSignal = dataSensor.signal;
    const defaultSignalIndex = signals.indexOf(defaultSignal);

    if (level === 'county' && region === '*') {
      // around 2k each
      return fetchSeparate(defaultSignalIndex);
    }
    return callTreeAPI(
      new SourceSignalPair(dataSensor.id, signals),
      new GeoPair(level, region),
      new TimePair('day', date),
      [...transferFields, 'signal'],
    ).then((d) => {
      return parseMultipleTreeData(d, signals, defaultSignalIndex, mixinValues, factor);
    });
  } else {
    mixinValues.signal = dataSensor.signal;
    return callAPI(
      new SourceSignalPair(dataSensor.id, dataSensor.signal),
      new GeoPair(level, region),
      new TimePair('day', date),
      transferFields,
    ).then((rows) => parseData(rows, mixinValues, factor));
  }
}

export interface NationSummarySamples {
  minDate: Date | null;
  maxDate: Date | null;
  totalSampleSize: number;
  averageSampleSize: number;
}

export async function fetchSampleSizesNationSummary(dataSensor: DataSensor): Promise<NationSummarySamples> {
  const data = await callAPI(
    new SourceSignalPair(dataSensor.id, dataSensor.signal),
    new GeoPair('nation', 'us'),
    new TimePair('day', new TimeFrame(START_TIME_RANGE, END_TIME_RANGE)),
    ['time_value', 'sample_size'],
  ).then((r) => parseData(r, {}));

  const sum = data.reduce((acc, v) => (v.sample_size != null ? acc + v.sample_size : acc), 0);
  return {
    // parse data produces sorted by date
    minDate: data.length > 0 ? data[0].date_value : null,
    maxDate: data.length > 0 ? data[data.length - 1].date_value : null,
    totalSampleSize: sum,
    averageSampleSize: sum / data.length,
  };
}

export function fetchRegionSlice(
  dataSensor: DataSensor,
  level: RegionLevel,
  date: '*' | Date,
  mixinValues: Partial<EpiDataRow> = {},
): Promise<EpiDataRow[]> {
  return fetchData(dataSensor, level, '*', date, {
    ...(date instanceof Date ? { time_value: Number.parseInt(formatAPITime(date), 10) } : {}),
    ...mixinValues,
  });
}

function createCopy<T extends EpiDataRow = EpiDataRow>(row: T, date: Date, dataSensor?: DataSensor): T {
  const copy = Object.assign({}, row, {
    date_value: date,
    time_value: Number.parseInt(formatAPITime(date), 10),
    value: null,
    stderr: null,
    sample_size: null,
  });
  if (
    (dataSensor != null && dataSensor.isCasesOrDeath) ||
    ((row as unknown) as EpiDataCasesOrDeathValues)[EPIDATA_CASES_OR_DEATH_VALUES[0]] !== undefined
  ) {
    EPIDATA_CASES_OR_DEATH_VALUES.forEach((key) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
      (copy as any)[key] = null;
    });
  }
  return copy;
}

export function fetchTimeSlice(
  dataSensor: DataSensor,
  level: RegionLevel,
  region: string | undefined | null,
  startDate = START_TIME_RANGE,
  endDate = END_TIME_RANGE,
  fitDateRange = false,
  mixinValues: Partial<EpiDataRow> = {},
  options: FetchDataOptions = {},
): Promise<EpiDataRow[]> {
  if (!region) {
    return Promise.resolve([] as EpiDataRow[]);
  }
  const data = fetchData(dataSensor, level, region, new TimeFrame(startDate, endDate), mixinValues, options);
  if (!fitDateRange) {
    return data;
  }
  return data.then((r) => fitRange(r, dataSensor, startDate, endDate));
}

/**
 * fit the data to be in the start/end date range
 */
export function fitRange<T extends EpiDataRow = EpiDataRow>(
  rows: T[],
  dataSensor: DataSensor,
  startDate: Date,
  endDate: Date,
): T[] {
  if (rows.length === 0) {
    return rows;
  }
  if (rows[0].date_value != null && rows[0].date_value > startDate) {
    // inject a min
    rows.unshift(createCopy(rows[0], startDate, dataSensor));
  }
  if (rows[rows.length - 1].date_value != null && rows[rows.length - 1].date_value < endDate) {
    // inject a max
    rows.push(createCopy(rows[rows.length - 1], endDate, dataSensor));
  }
  return rows;
}

/**
 * add missing rows per date within this given date rows
 */
export function addMissing<T extends EpiDataRow = EpiDataRow>(rows: T[], dataSensor: DataSensor): T[] {
  if (rows.length < 2) {
    return rows;
  }
  const min = rows[0].date_value;
  const max = rows[rows.length - 1].date_value;
  const template = rows[0];
  const base = rows.slice();
  const range = timeDay.range(min, timeDay.offset(max, 1), 1);
  if (range.length === rows.length) {
    // full
    return rows;
  }
  const imputedRows = range.map((date) => {
    if (base.length > 0 && base[0].date_value.getTime() <= date.getTime()) {
      return base.shift()!;
    }
    // create an entry
    return createCopy(template, date, dataSensor);
  });
  return imputedRows;
}

export function addNameInfos(rows: EpiDataRow[]): (EpiDataRow & RegionInfo)[] {
  for (const row of rows) {
    Object.assign(row, getInfoByName(row.geo_value, row.geo_type));
  }
  return rows as (EpiDataRow & RegionInfo)[];
}

function avg(
  rows: (EpiDataRow & Partial<EpiDataCasesOrDeathValues>)[],
  field: 'value' | 'stderr' | 'sample_size' | keyof EpiDataCasesOrDeathValues,
) {
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
    return null;
  }
  return sum / valid;
}
/**
 * group by date and averages its values
 */
export function averageByDate(
  rows: EpiDataRow[],
  dataSensor: DataSensor,
  mixin: Partial<EpiDataRow> = {},
): EpiDataRow[] {
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
  return Array.from(byDate.values())
    .map((rows) => {
      const r: EpiDataRow = {
        ...rows[0],
        ...mixin,
        value: avg(rows, 'value')!,
        stderr: avg(rows, 'stderr')!,
        sample_size: avg(rows, 'sample_size')!,
      };
      if (
        (dataSensor != null && dataSensor.isCasesOrDeath) ||
        ((rows[0] as unknown) as EpiDataCasesOrDeathValues)[EPIDATA_CASES_OR_DEATH_VALUES[0]] !== undefined
      ) {
        EPIDATA_CASES_OR_DEATH_VALUES.forEach((key) => {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
          (r as any)[key] = avg(rows, key);
        });
      }
      return r;
    })
    .sort((a, b) => a.time_value - b.time_value);
}
