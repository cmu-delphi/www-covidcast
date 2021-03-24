// Indicator Info: aka The Signal Dashboard API

import { formatAPITime, parseAPITime } from './utils';
import { callSignalAPI } from './api';
import { fetchData } from './fetchData';

/**
 * @typedef {object} Coverage
 * @property {Date} date
 * @property {number} count
 */

/**
 * @typedef {object} IndicatorStatus
 * @property {string} name
 * @property {string} source
 * @property {string} covidcast_signal
 * @property {Date} latest_issue
 * @property {Date} latest_time_value
 * @property {Record<'county', Coverage[]>} coverage
 */

/**
 * @returns {Promise<IndicatorStatus[]>}
 */
export function getIndicatorStatuses() {
  return callSignalAPI().then((d) => {
    if (d.result < 0 || d.message.includes('no results')) {
      return [];
    }
    const data = d.epidata || [];
    for (const row of data) {
      row.latest_issue = parseAPITime(row.latest_issue.toString());
      row.latest_time_value = parseAPITime(row.latest_time_value.toString());
      Object.values(row.coverage).forEach((level) => {
        for (const row of level) {
          row.date = parseAPITime(row.date.toString());
        }
      });
    }
    return data;
  });
}

/**
 *
 * @param {IndicatorStatus} indicator
 * @param {Date} date
 * @returns {Promise<import('.').EpiDataRow[]>}
 */
export function getAvailableCounties(indicator, date) {
  return fetchData(
    {
      id: indicator.source,
      signal: indicator.covidcast_signal,
    },
    'county',
    '*',
    date,
    { time_value: formatAPITime(date) },
    {
      multi_values: false,
    },
  );
}
