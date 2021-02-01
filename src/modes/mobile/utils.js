import { formatAPITime } from '../../data';
import { EPIDATA_CASES_OR_DEATH_VALUES } from '../../stores/constants';
import { timeWeek } from 'd3-time';
/**
 * @typedef {object} Params
 * @property {import('../../maps').NameInfo} region
 * @property {Date} startDay
 * @property {Date} endDay
 */


function toTimeValue(date) {
  return Number.parseInt(formatAPITime(date), 10);
}
/**
 * @param {Date} date
 * @param {import("../../data").EpiDataRow[]} data
 */
export function findDateRow(date, data) {
  const apiDate = toTimeValue(date);
  return data.find((d) => d.time_value === apiDate);
}

function averageDayValue(obj, prop = 'value') {
  Object.defineProperty(obj, prop, {
    get: function () {
      let valid = 0;
      let sum = 0;
      for (const day of this.days) {
        if (day[prop] == null) {
          continue;
        }
        valid++;
        sum += day[prop];
      }
      if (valid === 0) {
        return null;
      }
      return sum / valid;
    },
  });
}

/**
 * @param {import("../../data").EpiDataRow[]} data
 */
export function aggregateByWeek(data, isCasesOrDeath = false) {
  const byWeek = [];
  let current = null;
  // assume sorted
  for (const row of data) {
    const week = timeWeek(row.date_value);
    if (current === null || current.week_value < week) {
      current = Object.assign({}, row, {
        week_value: week,
        days: [row],
      });
      averageDayValue(current, 'value');
      if (isCasesOrDeath) {
        for (const key of EPIDATA_CASES_OR_DEATH_VALUES) {
          averageDayValue(current, key);
        }
      }
      byWeek.push(current);
    } else {
      current.days.push(row);
    }
  }
  return byWeek;
}