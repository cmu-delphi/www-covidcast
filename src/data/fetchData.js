import { callAPIEndPoint } from './api';
import { timeDay } from 'd3-time';
import { parseAPITime, formatAPITime } from './utils';
import { getInfoByName } from '../maps';

/**
 * @typedef {import('../stores/constants').SensorEntry} SensorEntry
 */

// * @property {number} issue
// * @property {number} lag
// * @property {number | null} sample_size

/**
 * @typedef {object} EpiDataRow
 * @property {string} geo_value
 * @property {number | null} stderr
 * @property {number} time_value
 * @property {Date} date_value the time_value as a Date
 * @property {number} value
 * @property {string} signal
 */

/**
 * @param {Partial<EpiDataRow>} mixinValues
 */
function computeTransferFields(mixinValues = {}, advanced = false, transferSignal = false) {
  const toRemove = Object.keys(mixinValues);
  const allFields = ['geo_value', 'stderr', 'time_value', 'value'];
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

export const START_TIME_RANGE = parseAPITime('20100101');
export const END_TIME_RANGE = parseAPITime('20500101');

function parseData(d, mixinData = {}, factor = 1) {
  if (d.result < 0 || d.message.includes('no results')) {
    return [];
  }
  const data = d.epidata || [];

  for (const row of data) {
    Object.assign(row, mixinData);
    if (row.time_value == null) {
      row.date_value = null;
      continue;
    }
    row.date_value = parseAPITime(row.time_value.toString());
    row.value = row.value * factor;
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

/**
 * @param {SensorEntry} sensorEntry
 * @param {string} level
 * @param {string | undefined} region
 * @param {Date | string} date
 * @param {Partial<EpiDataRow>} mixinValues
 * @param {{advanced?: boolean}} options
 * @returns {Promise<EpiDataRow[]>}
 */
export function fetchData(
  sensorEntry,
  level,
  region,
  date,
  mixinValues = {},
  { advanced = false, transferSignal = false, factor = 1 } = {},
) {
  if (!region) {
    return Promise.resolve([]);
  }
  const transferFields = computeTransferFields(mixinValues, advanced, transferSignal);

  return callAPIEndPoint(
    sensorEntry.api,
    sensorEntry.id,
    sensorEntry.signal,
    level,
    date,
    region,
    transferFields,
  ).then((rows) => parseData(rows, mixinValues, factor));
}

export async function fetchSampleSizesNationSummary(sensorEntry) {
  /**
   * @type {EpiDataRow[]}
   */
  const data = await callAPIEndPoint(
    sensorEntry.api,
    sensorEntry.id,
    sensorEntry.signal,
    'nation',
    `${formatAPITime(START_TIME_RANGE)}-${formatAPITime(END_TIME_RANGE)}`,
    'us',
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

/**
 *
 * @param {EpiDataRow} row
 * @param {Date} date
 */
function createCopy(row, date) {
  const copy = Object.assign({}, row, {
    date_value: date,
    time_value: Number.parseInt(formatAPITime(date), 10),
    value: null,
    stderr: null,
    sample_size: null,
  });
  return copy;
}

/**
 * fit the data to be in the start/end date range
 * @param {EpiDataRow[]} rows
 * @param {SensorEntry} sensor
 * @param {Date} startDate
 * @param {Date} endDate
 * @returns {EpiDataRow[]}
 */
export function fitRange(rows, sensor, startDate, endDate) {
  if (rows.length === 0) {
    return rows;
  }
  if (rows[0].date_value != null && rows[0].date_value > startDate) {
    // inject a min
    rows.unshift(createCopy(rows[0], startDate));
  }
  if (rows[rows.length - 1].date_value != null && rows[rows.length - 1].date_value < endDate) {
    // inject a max
    rows.push(createCopy(rows[rows.length - 1], endDate));
  }
  return rows;
}

/**
 * add missing rows per date within this given date rows
 * @param {EpiDataRow[]} rows
 * @returns {EpiDataRow[]}
 */
export function addMissing(rows) {
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
      return base.shift();
    }
    // create an entry
    return createCopy(template, date);
  });
  return imputedRows;
}

export function addNameInfos(rows) {
  for (const row of rows) {
    Object.assign(row, getInfoByName(row.geo_value));
  }
  return rows;
}

function avg(rows, field) {
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
 * @param {EpiDataRow[]} rows
 * @param {SensorEntry} sensor
 * @returns {EpiDataRow[]}
 */
export function averageByDate(rows, sensor, mixin = {}) {
  // average by date
  const byDate = new Map();
  for (const row of rows) {
    const key = row.time_value;
    if (byDate.has(key)) {
      byDate.get(key).push(row);
    } else {
      byDate.set(key, [row]);
    }
  }
  return Array.from(byDate.values())
    .map((rows) => {
      const r = {
        ...rows[0],
        ...mixin,
        value: avg(rows, 'value'),
        stderr: avg(rows, 'stderr'),
        sample_size: avg(rows, 'sample_size'),
      };
      return r;
    })
    .sort((a, b) => a.time_value - b.time_value);
}
