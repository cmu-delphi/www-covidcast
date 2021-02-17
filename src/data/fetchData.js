import { callAPIEndPoint } from './api';
import { timeDay } from 'd3-time';
import { parseAPITime, formatAPITime, combineSignals } from './utils';
import { EPIDATA_CASES_OR_DEATH_VALUES } from '../stores/constants';

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
function computeTransferFields(mixinValues = {}, advanced = false) {
  const toRemove = Object.keys(mixinValues);
  const allFields = ['geo_value', 'stderr', 'time_value', 'value'];
  if (advanced) {
    allFields.push('issue', 'sample_size');
  }
  return allFields.filter((d) => !toRemove.includes(d));
}

/**
 * @typedef {EpiDataRow & EpiDataCasesOrDeathValues} EpiDataCasesOrDeathRow
 */

export const START_TIME_RANGE = parseAPITime('20100101');
export const END_TIME_RANGE = parseAPITime('20500101');

function parseData(d, mixinData = {}) {
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

function parseMultipleTreeData(d, signals, defaultSignalIndex, mixinData = {}) {
  if (d.result < 0 || d.message.includes('no results')) {
    return [];
  }
  const tree = d.epidata || [];
  if (tree.length === 0 || (Array.isArray(tree[0]) && tree[0].length === 0)) {
    return parseData({ ...d, epidata: [] }, mixinData);
  }
  const split = signals.map((k) => tree[0][k]);
  const ref = split[defaultSignalIndex];
  const combined = combineSignals(split, ref, EPIDATA_CASES_OR_DEATH_VALUES, deriveCombineKey(mixinData));
  return parseData(
    {
      ...d,
      epidata: combined,
    },
    mixinData,
  );
}

function parseMultipleSeparateData(dataArr, defaultSignalIndex, mixinData = {}) {
  if (dataArr.length === 0 || dataArr[0].result < 0 || dataArr[0].message.includes('no results')) {
    return [];
  }
  const data = dataArr.map((d) => d.epidata || []);
  const ref = data[defaultSignalIndex];
  const combined = combineSignals(data, ref, EPIDATA_CASES_OR_DEATH_VALUES, deriveCombineKey(mixinData));
  return parseData(
    {
      ...dataArr[0],
      epidata: combined,
    },
    mixinData,
  );
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
  { advanced = false, multiValues = true } = {},
) {
  if (!region) {
    return Promise.resolve([]);
  }
  const transferFields = computeTransferFields(mixinValues, advanced);
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
          sensorEntry.api,
          sensorEntry.id,
          sensorEntry.casesOrDeathSignals[k],
          level,
          date,
          region,
          i === 0 ? transferFields : extraDataFields,
        ),
      ),
    ).then((d) => parseMultipleSeparateData(d, defaultSignalIndex, mixinValues));
  }

  if (sensorEntry.isCasesOrDeath && multiValues) {
    const signals = EPIDATA_CASES_OR_DEATH_VALUES.map((k) => sensorEntry.casesOrDeathSignals[k]);
    const defaultSignal = sensorEntry.signal;
    const defaultSignalIndex = signals.indexOf(defaultSignal);

    if (level === 'county' && region === '*') {
      // around 2k each
      return fetchSeparate(defaultSignalIndex);
    }
    return callAPIEndPoint(
      sensorEntry.api,
      sensorEntry.id,
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
      return parseMultipleTreeData(d, signals, defaultSignalIndex, mixinValues);
    });
  } else {
    return callAPIEndPoint(
      sensorEntry.api,
      sensorEntry.id,
      sensorEntry.signal,
      level,
      date,
      region,
      transferFields,
    ).then((rows) => parseData(rows, mixinValues));
  }
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
 * @param {SensorEntry} sensorEntry
 * @param {string} level
 * @param {string | Date} date
 * @param {Partial<EpiDataRow>} mixinValues
 * @returns {Promise<EpiDataRow[]>}
 */
export function fetchRegionSlice(sensorEntry, level, date, mixinValues = {}) {
  return fetchData(sensorEntry, level, '*', date, {
    ...(date instanceof Date ? { time_value: formatAPITime(date) } : {}),
    ...mixinValues,
  });
}

/**
 *
 * @param {EpiDataRow} row
 * @param {Date} date
 * @param {SensorEntry} sensorEntry
 */
function createCopy(row, date, sensorEntry) {
  const copy = Object.assign({}, row, {
    date_value: date,
    time_value: Number.parseInt(formatAPITime(date), 10),
    value: null,
    stderr: null,
    sample_size: null,
  });
  if ((sensorEntry != null && sensorEntry.isCasesOrDeath) || row[EPIDATA_CASES_OR_DEATH_VALUES[0]] !== undefined) {
    EPIDATA_CASES_OR_DEATH_VALUES.forEach((key) => {
      copy[key] = null;
    });
  }
  return copy;
}

/**
 * @param {SensorEntry} sensorEntry
 * @param {string} level
 * @param {string | undefined} region
 * @param {Date} startDate
 * @param {Date} endDate
 * @param {boolean} fitRange
 * @param {Partial<EpiDataRow>} mixinValues
 * @returns {Promise<EpiDataRow[]>}
 */
export function fetchTimeSlice(
  sensorEntry,
  level,
  region,
  startDate = START_TIME_RANGE,
  endDate = END_TIME_RANGE,
  fitRange = false,
  mixinValues = {},
  options = {},
) {
  if (!region) {
    return Promise.resolve([]);
  }
  const timeRange = `${formatAPITime(startDate)}-${formatAPITime(endDate)}`;
  const data = fetchData(sensorEntry, level, region, timeRange, mixinValues, options);
  if (!fitRange) {
    return data;
  }
  return data.then((r) => fitRange(r, sensorEntry, startDate, endDate));
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
    rows.unshift(createCopy(rows[0], startDate, sensor));
  }
  if (rows[rows.length - 1].date_value != null && rows[rows.length - 1].date_value < endDate) {
    // inject a max
    rows.push(createCopy(rows[rows.length - 1], endDate, sensor));
  }
  return rows;
}

/**
 * add missing rows per date within this given date rows
 * @param {EpiDataRow[]} rows
 * @param {SensorEntry} sensor
 * @returns {EpiDataRow[]}
 */
export function addMissing(rows, sensor) {
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
    return createCopy(template, date, sensor);
  });
  return imputedRows;
}

function avg(rows, field) {
  const sum = rows.reduce((acc, v) => acc + v[field], 0);
  if (sum == null || Number.isNaN(sum)) {
    return null;
  }
  return sum / rows.length;
}
/**
 * group by date and averages its values
 * @param {EpiDataRow[]} rows
 * @param {SensorEntry} sensor
 * @returns {EpiDataRow[]}
 */
export function averageByDate(rows, sensor) {
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
        value: avg(rows, 'value'),
        stderr: avg(rows, 'stderr'),
        sample_size: avg(rows, 'sample_size'),
      };
      if ((sensor != null && sensor.isCasesOrDeath) || rows[0][EPIDATA_CASES_OR_DEATH_VALUES[0]] !== undefined) {
        EPIDATA_CASES_OR_DEATH_VALUES.forEach((key) => {
          r[key] = avg(rows, key);
        });
      }
      return r;
    })
    .sort((a, b) => a.time_value - b.time_value);
}
