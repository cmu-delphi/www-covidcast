import { formatAPITime } from './utils';
import { timeDay, randomNormal } from 'd3';

const mockStartDate = timeDay.floor(new Date(2020, 4, 1));
const mockEndDate = timeDay.offset(timeDay.floor(new Date()), -1);
const mean = 20;
const std = 3;
const rand = randomNormal(mean, std);
/**
 *
 * @param {string} id
 * @param {string} signal
 * @param {string} level
 * @param {Date | string} date
 * @param {string} region
 */
export function generateMockSignal(_id, _signal, level, date, region) {
  return import('../maps').then((r) => {
    const swpaNameInfos = r.swpaNameInfos;

    /**
     * @type {import('./fetchData').EpiDataRow[]}
     */
    const data = [];

    const direction = 0;
    const issue = Number.parseInt(formatAPITime(mockEndDate), 10);
    const lag = 1;
    const sampleSize = null;
    const stdErr = null;

    const pushEntry = (timeValue, geoValue) => {
      data.push({
        time_value: Number.parseInt(formatAPITime(timeValue), 10),
        direction,
        issue,
        lag,
        sample_size: sampleSize,
        stderr: stdErr,
        geo_value: geoValue,
        value: rand(),
      });
    };

    if (typeof date === 'string' && date.includes('-')) {
      // range
      const geoValue = region;
      const timeValues = timeDay.range(mockStartDate, mockEndDate);
      for (const timeValue of timeValues) {
        pushEntry(timeValue, geoValue);
      }
    } else {
      // single
      const timeValue = Number.parseInt(date instanceof Date ? formatAPITime(date) : date, 10);
      const geoValues = swpaNameInfos.filter((d) => d.level === level).map((d) => d.id);
      for (const geoValue of geoValues) {
        pushEntry(timeValue, geoValue);
      }
    }
    return {
      result: 1,
      message: 'Success',
      epidata: data,
    };
  });
}

export function generateMockMeta(id, signal) {
  return [
    {
      data_source: id,
      signal,
      time_type: 'day',
      min_time: Number.parseInt(formatAPITime(mockStartDate), 10),
      max_time: Number.parseInt(formatAPITime(mockEndDate), 10),
      mean_value: mean,
      stdev_value: std,
    },
  ];
}
