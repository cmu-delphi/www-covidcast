import { callAPIEndPoint } from './api';
import { timeDay } from 'd3-time';
import { parseAPITime, formatAPITime, combineSignals } from './utils';
import { EPIDATA_CASES_OR_DEATH_VALUES } from '../stores/constants';
import { getInfoByName } from '../maps';

/**
 * @typedef {object} DataSensor
 * @property {string} id
 * @property {string} signal
 * @property {boolean=} isCasesOrDeath
 * @property {Record<string, string>=} casesOrDeathSignals
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

function deriveCombineKey(mixinData = {}) {
  let combineKey = (d) => `${d.geo_value}@${d.time_value}`;
  // part of key
  if (mixinData.time_value != null) {
    combineKey = (d) => `${d.geo_value}`;
  } else if (mixinData.geo_value == null) {
    combineKey = (d) => `${d.time_value}`;
  }
  return combineKey;
}

function parseMultipleTreeData(d, signals, defaultSignalIndex, mixinData = {}, factor = 1) {
  if (d.result < 0 || d.message.includes('no results')) {
    return [];
  }
  const tree = d.epidata || [];
  if (tree.length === 0 || (Array.isArray(tree[0]) && tree[0].length === 0)) {
    return parseData({ ...d, epidata: [] }, mixinData, factor);
  }
  const split = signals.map((k) => tree[0][k]);
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

function parseMultipleSeparateData(dataArr, defaultSignalIndex, mixinData = {}, factor = 1) {
  if (dataArr.length === 0 || dataArr[0].result < 0 || dataArr[0].message.includes('no results')) {
    return [];
  }
  const data = dataArr.map((d) => d.epidata || []);
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

/**
 * @param {DataSensor} dataSensor
 * @param {string} level
 * @param {string | undefined} region
 * @param {Date | string} date
 * @param {Partial<EpiDataRow>} mixinValues
 * @param {{advanced?: boolean}} options
 * @returns {Promise<EpiDataRow[]>}
 */
export function fetchData(
  dataSensor,
  level,
  region,
  date,
  mixinValues = {},
  { advanced = false, multiValues = true, transferSignal = false, factor = 1 } = {},
) {
  if (!region) {
    return Promise.resolve([]);
  }
  const transferFields = computeTransferFields(mixinValues, advanced, transferSignal);
  function fetchSeparate(defaultSignalIndex) {
    const extraDataFields = ['value'];
    // part of key
    if (mixinValues.time_value == null) {
      extraDataFields.push(['time_value']);
    }
    if (mixinValues.geo_value == null) {
      extraDataFields.push(['geo_value']);
    }
    return Promise.all(
      EPIDATA_CASES_OR_DEATH_VALUES.map((k, i) =>
        callAPIEndPoint(
          dataSensor.api,
          dataSensor.id,
          dataSensor.casesOrDeathSignals[k],
          level,
          date,
          region,
          i === 0 ? transferFields : extraDataFields,
        ),
      ),
    ).then((d) => parseMultipleSeparateData(d, defaultSignalIndex, mixinValues, factor));
  }

  if (dataSensor.isCasesOrDeath && multiValues) {
    const signals = EPIDATA_CASES_OR_DEATH_VALUES.map((k) => dataSensor.casesOrDeathSignals[k]);
    const defaultSignal = dataSensor.signal;
    const defaultSignalIndex = signals.indexOf(defaultSignal);

    if (level === 'county' && region === '*') {
      // around 2k each
      return fetchSeparate(defaultSignalIndex);
    }
    return callAPIEndPoint(
      dataSensor.api,
      dataSensor.id,
      signals.join(','),
      level,
      date,
      region,
      [...transferFields, 'signal'],
      'tree',
    ).then((d) => {
      if (d.result === 2) {
        // need to fetch separately, since too many results
        return fetchSeparate(defaultSignalIndex);
      }
      return parseMultipleTreeData(d, signals, defaultSignalIndex, mixinValues, factor);
    });
  } else {
    return callAPIEndPoint(
      dataSensor.api,
      dataSensor.id,
      dataSensor.signal,
      level,
      date,
      region,
      transferFields,
    ).then((rows) => parseData(rows, mixinValues, factor));
  }
}

/**
 * @param {DataSensor} dataSensor
 */
export async function fetchSampleSizesNationSummary(dataSensor) {
  /**
   * @type {EpiDataRow[]}
   */
  const data = await callAPIEndPoint(
    dataSensor.api,
    dataSensor.id,
    dataSensor.signal,
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
 * @param {DataSensor} dataSensor
 * @param {string} level
 * @param {string | Date} date
 * @param {Partial<EpiDataRow>} mixinValues
 * @returns {Promise<EpiDataRow[]>}
 */
export function fetchRegionSlice(dataSensor, level, date, mixinValues = {}) {
  return fetchData(dataSensor, level, '*', date, {
    ...(date instanceof Date ? { time_value: formatAPITime(date) } : {}),
    ...mixinValues,
  });
}

/**
 *
 * @param {EpiDataRow} row
 * @param {Date} date
 * @param {DataSensor} dataSensor
 */
function createCopy(row, date, dataSensor) {
  const copy = Object.assign({}, row, {
    date_value: date,
    time_value: Number.parseInt(formatAPITime(date), 10),
    value: null,
    stderr: null,
    sample_size: null,
  });
  if ((dataSensor != null && dataSensor.isCasesOrDeath) || row[EPIDATA_CASES_OR_DEATH_VALUES[0]] !== undefined) {
    EPIDATA_CASES_OR_DEATH_VALUES.forEach((key) => {
      copy[key] = null;
    });
  }
  return copy;
}

/**
 * @param {DataSensor} dataSensor
 * @param {string} level
 * @param {string | undefined} region
 * @param {Date} startDate
 * @param {Date} endDate
 * @param {boolean} fitDateRange
 * @param {Partial<EpiDataRow>} mixinValues
 * @returns {Promise<EpiDataRow[]>}
 */
export function fetchTimeSlice(
  dataSensor,
  level,
  region,
  startDate = START_TIME_RANGE,
  endDate = END_TIME_RANGE,
  fitDateRange = false,
  mixinValues = {},
  options = {},
) {
  if (!region) {
    return Promise.resolve([]);
  }
  const timeRange = `${formatAPITime(startDate)}-${formatAPITime(endDate)}`;
  const data = fetchData(dataSensor, level, region, timeRange, mixinValues, options);
  if (!fitDateRange) {
    return data;
  }
  return data.then((r) => fitRange(r, dataSensor, startDate, endDate));
}

/**
 * fit the data to be in the start/end date range
 * @param {EpiDataRow[]} rows
 * @param {DataSensor} dataSensor
 * @param {Date} startDate
 * @param {Date} endDate
 * @returns {EpiDataRow[]}
 */
export function fitRange(rows, dataSensor, startDate, endDate) {
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
 * @param {EpiDataRow[]} rows
 * @param {DataSensor} dataSensor
 * @returns {EpiDataRow[]}
 */
export function addMissing(rows, dataSensor) {
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
    return createCopy(template, date, dataSensor);
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
 * @param {DataSensor} dataSensor
 * @returns {EpiDataRow[]}
 */
export function averageByDate(rows, dataSensor, mixin = {}) {
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
      if (
        (dataSensor != null && dataSensor.isCasesOrDeath) ||
        rows[0][EPIDATA_CASES_OR_DEATH_VALUES[0]] !== undefined
      ) {
        EPIDATA_CASES_OR_DEATH_VALUES.forEach((key) => {
          r[key] = avg(rows, key);
        });
      }
      return r;
    })
    .sort((a, b) => a.time_value - b.time_value);
}
