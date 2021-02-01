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
export function aggregateByWeek(data, sensor, startDay, endDay) {
  if (data.length === 0) {
    return [];
  }
  const template = data[0];
  const stack = data.slice().reverse();
  return timeWeek.range(timeWeek.floor(startDay), timeWeek.floor(endDay)).map((week) => {
    const current = Object.assign({}, template, {
      date_value: week,
      week_value: week,
      days: [],
    });
    averageDayValue(current, 'value');
    if (sensor.isCasesOrDeath) {
      for (const key of EPIDATA_CASES_OR_DEATH_VALUES) {
        averageDayValue(current, key);
      }
    }
    while (stack.length > 0) {
      const entry = stack.pop();
      const entryWeek = timeWeek(entry.date_value);
      if (entryWeek <= week) {
        current.days.push(entry);
      } else {
        // part of next one, push back
        stack.push(entry);
        break;
      }
    }
    return current;
  });
}
