import { callAPIEndPoint } from './api';
import { parseAPITime, formatAPITime, combineSignals } from './utils';
import { EPIDATA_CASES_OR_DEATH_VALUES } from '../stores/constants';

/**
 * @typedef {import('../stores/constants').SensorEntry} SensorEntry
 */
/**
 * @typedef {object} EpiDataRow
 * @property {number} direction
 * @property {string} geo_value
 * @property {number} issue
 * @property {number} lag
 * @property {number | null} sample_size
 * @property {number | null} stderr
 * @property {number} time_value
 * @property {Date} date_value the time_value as a Date
 * @property {number} value
 */

/**
 * @typedef {EpiDataRow & EpiDataCasesOrDeathValues} EpiDataCasesOrDeathRow
 */

const START_TIME_RANGE = parseAPITime('20100101');
const END_TIME_RANGE = parseAPITime('20500101');

function parseData(d) {
  if (d.result < 0 || d.message.includes('no results')) {
    return [];
  }
  const data = d.epidata || [];

  for (const row of data) {
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

function parseMultipleData(data) {
  if ((data.length > 0 && data[0].result < 0) || data[0].message.includes('no results')) {
    return [];
  }
  if (data.length === 0) {
    return [];
  }
  const combined = combineSignals(
    data.map((d) => d.epidata || []),
    EPIDATA_CASES_OR_DEATH_VALUES,
  );
  return parseData({
    ...data[0],
    epidata: combined,
  });
}

/**
 * @param {SensorEntry} sensorEntry
 * @param {string} level
 * @param {string | undefined} region
 * @param {Date | string} date
 * @returns {Promise<EpiDataRow[]>}
 */
function fetchData(sensorEntry, level, region, date) {
  if (!region) {
    return Promise.resolve([]);
  }
  if (sensorEntry.isCasesOrDeath) {
    return Promise.all(
      EPIDATA_CASES_OR_DEATH_VALUES.map((k) =>
        callAPIEndPoint(sensorEntry.api, sensorEntry.id, sensorEntry.casesOrDeathSignals[k], level, date, region),
      ),
    ).then(parseMultipleData);
  } else {
    return callAPIEndPoint(sensorEntry.api, sensorEntry.id, sensorEntry.signal, level, date, region).then(parseData);
  }
}

/**
 *
 * @param {SensorEntry} sensorEntry
 * @param {string} level
 * @param {string | Date} date
 * @returns {Promise<EpiDataRow[]>}
 */
export function fetchRegionSlice(sensorEntry, level, date) {
  return fetchData(sensorEntry, level, '*', date);
}

/**
 * @param {SensorEntry} sensorEntry
 * @param {string} level
 * @param {string | undefined} region
 * @param {Date} startDate
 * @param {Date} endDate
 * @returns {Promise<EpiDataRow[]>}
 */
export function fetchTimeSlice(sensorEntry, level, region, startDate = START_TIME_RANGE, endDate = END_TIME_RANGE) {
  if (!region) {
    return Promise.resolve([]);
  }
  const timeRange = `${formatAPITime(startDate)}-${formatAPITime(endDate)}`;
  return fetchData(sensorEntry, level, region, timeRange);
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
    direction: null,
    sample_size: null,
  });
  if (sensorEntry.isCasesOrDeath) {
    EPIDATA_CASES_OR_DEATH_VALUES.forEach((key) => {
      copy[key] = null;
    });
  }
  return copy;
}

/**
 *
 * @param {Promise<EpiDataRow[]>[]} all
 * @param {((i: number) => SensorEntry)} sensorOf
 * @param {Date} startDate
 * @param {Date} endDate
 * @param {boolean} fitRange
 */
function syncStartEnd(all, sensorOf, startDate, endDate, fitRange = false) {
  const adaptMinMax = (r, i, min, max) => {
    if (r.length === 0) {
      return r;
    }
    if (r[0].date_value != null && r[0].date_value.getTime() > min) {
      // inject a min
      r.unshift(createCopy(r[0], new Date(min), sensorOf(i)));
    }
    if (r[r.length - 1].date_value != null && r[r.length - 1].date_value.getTime() < max) {
      // inject a max
      r.push(createCopy(r[r.length - 1], new Date(max), sensorOf(i)));
    }
    return r;
  };
  if (fitRange) {
    // fast can adapt every one independently
    return all.map((promise, i) => promise.then((r) => adaptMinMax(r, i, startDate.getTime(), endDate.getTime())));
  }
  // sync start and end date
  const allDone = Promise.all(all).then((rows) => {
    const min = rows.reduce(
      (acc, r) => (r.length === 0 || r[0].date_value == null ? acc : Math.min(acc, r[0].date_value.getTime())),
      Number.POSITIVE_INFINITY,
    );
    const max = rows.reduce(
      (acc, r) =>
        r.length === 0 || r[r.length - 1].date_value == null
          ? acc
          : Math.max(acc, r[r.length - 1].date_value.getTime()),
      Number.NEGATIVE_INFINITY,
    );
    return rows.map((r, i) => adaptMinMax(r, i, min, max));
  });
  return all.map((_, i) => allDone.then((r) => r[i]));
}

/**
 * fetch multiple signals and synchronizes their start / end date
 * @param {SensorEntry[]} sensorEntries
 * @param {string} level
 * @param {string | undefined} region
 * @param {Date} startDate
 * @param {Date} endDate
 * @param {boolean} fitRange
 * @returns {Promise<EpiDataRow[]>[]}
 */
export function fetchMultipleTimeSlices(
  sensorEntries,
  level,
  region,
  startDate = START_TIME_RANGE,
  endDate = END_TIME_RANGE,
  fitRange = false,
) {
  const all = sensorEntries.map((entry) => fetchTimeSlice(entry, level, region, startDate, endDate));
  if (sensorEntries.length <= 1) {
    return all;
  }
  return syncStartEnd(all, (i) => sensorEntries[i], startDate, endDate, fitRange);
}

/**
 * fetch multiple regions and synchronizes their start / end date
 * @param {SensorEntry} sensorEntry
 * @param {string} level
 * @param {string[]} region
 * @param {Date} startDate
 * @param {Date} endDate
 * @param {boolean} fitRange
 * @returns {Promise<EpiDataRow[]>[]}
 */
export function fetchMultipleRegionsTimeSlices(
  sensorEntry,
  level,
  regions,
  startDate = START_TIME_RANGE,
  endDate = END_TIME_RANGE,
  fitRange = false,
) {
  const all = regions.map((region) => fetchTimeSlice(sensorEntry, level, region, startDate, endDate));
  if (regions.length <= 1) {
    return all;
  }
  return syncStartEnd(all, () => sensorEntry, startDate, endDate, fitRange);
}
