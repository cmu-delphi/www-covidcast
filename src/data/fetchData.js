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
 * @property {stderr | null} stderr
 * @property {number} time_value
 * @property {Date} date_value the time_value as a Date
 * @property {number} value
 */

/**
 * @typedef {EpiDataRow & EpiDataCasesOrDeathValues} EpiDataCasesOrDeathRow
 */

const START_TIME_RANGE = parseAPITime('20100101');
const END_TIME_RANGE = parseAPITime('20500101');

function parseData(data) {
  for (const row of data) {
    if (row.time_value == null) {
      row.date_value = null;
      continue;
    }
    row.date_value = parseAPITime(row.time_value.toString());
  }
  return data;
}

/**
 *
 * @param {SensorEntry} sensorEntry
 * @param {string} level
 * @param {string} date
 * @returns {Promise<EpiDataRow[]>}
 */
export function fetchRegionSlice(sensorEntry, level, date) {
  let promise;
  if (sensorEntry.isCasesOrDeath) {
    promise = Promise.all(
      EPIDATA_CASES_OR_DEATH_VALUES.map((k) =>
        callAPIEndPoint(sensorEntry.api, sensorEntry.id, sensorEntry.casesOrDeathSignals[k], level, date, '*'),
      ),
    ).then((data) => {
      if ((data.length > 0 && data[0].result < 0) || data[0].message.includes('no results')) {
        return [];
      }
      const combined = combineSignals(
        data.map((d) => d.epidata),
        EPIDATA_CASES_OR_DEATH_VALUES,
      );
      return parseData(combined);
    });
  } else {
    promise = callAPIEndPoint(sensorEntry.api, sensorEntry.id, sensorEntry.signal, level, date, '*').then((d) => {
      if (d.result < 0 || d.message.includes('no results')) {
        return [];
      }
      return parseData(d.epidata);
    });
  }
  return promise;
}

/**
 * @param {SensorEntry} sensorEntry
 * @param {string} level
 * @param {string | undefined} region
 * @param {Date} startDate
 * @param {Date} endDate
 * @returns {Promise<EpiDataRow[]>}
 */
export function fetchCustomTimeSlice(sensorEntry, level, region, startDate, endDate) {
  if (!region) {
    return Promise.resolve([]);
  }
  const timeRange = `${formatAPITime(startDate)}-${formatAPITime(endDate)}`;
  return callAPIEndPoint(sensorEntry.api, sensorEntry.id, sensorEntry.signal, level, timeRange, region).then((d) => {
    if (d.result < 0 || d.message.includes('no results')) {
      return [];
    }
    return parseData(d.epidata);
  });
}

/**
 * @param {SensorEntry} sensorEntry
 * @param {string} level
 * @param {string | undefined} region
 * @returns {Promise<EpiDataRow[]>}
 */
export function fetchTimeSlice(sensorEntry, level, region) {
  return fetchCustomTimeSlice(sensorEntry, level, region, START_TIME_RANGE, END_TIME_RANGE);
}
