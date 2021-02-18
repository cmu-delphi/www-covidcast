import { formatAPITime } from '../../data';
/**
 * @typedef {object} Params
 * @property {import('../../maps').NameInfo} region
 * @property {Date} date
 * @property {number} timeValue
 */

export function toTimeValue(date) {
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