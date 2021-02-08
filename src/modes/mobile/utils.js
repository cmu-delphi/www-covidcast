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

/**
 * @param {import('../../stores/constants').SensorEntry} sensor 
 */
export function guessSensorColor(sensor) {
  if (sensor.colorScaleId === 'interpolateYlGnBu') {
    // green
    return '#27AE60';
  }
  if (sensor.type === 'public' || sensor.name.includes('Quidel')) {
    // blue
    return '#2D9CDB';
  }
  // red
  return '#EB5757';
}