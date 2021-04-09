// Indicator Info: aka The Signal Dashboard API

import { formatAPITime, parseAPITime } from './utils';
import { callSignalAPI } from './api';
import { fetchData } from './fetchData';
import { addNameInfos } from '.';
import { countyInfo } from '../maps';

/**
 * @typedef {object} Coverage
 * @property {Date} date
 * @property {number} count
 * @property {number} fraction // fraction
 */

/**
 * @typedef {object} IndicatorStatus
 * @property {string} id
 * @property {string} name
 * @property {string} source
 * @property {string} covidcast_signal
 * @property {Date} latest_issue
 * @property {Date} latest_time_value
 * @property {Record<'county', Coverage[]>} coverage
 */

function parseFakeISO(value) {
  return parseAPITime(value.toString().replace(/-/gm, ''));
}

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
      row.id = row.name.toLowerCase().replace(/\s/g, '-');
      row.latest_issue = parseFakeISO(row.latest_issue);
      row.latest_time_value = parseFakeISO(row.latest_time_value);
      Object.values(row.coverage).forEach((level) => {
        for (const row of level) {
          row.date = parseFakeISO(row.date);
          row.fraction = row.count / countyInfo.length;
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
 * @returns {Promise<(import('.').EpiDataRow & import('../maps').NameInfo)[]>}
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
  ).then((rows) => addNameInfos(rows).filter((d) => d.level === 'county'));
}
