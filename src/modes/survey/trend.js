import { timeDay } from 'd3-time';
import { formatAPITime } from '../../data';

/**
 * @param {import("../../data").EpiDataRow[]} data
 * @returns {import("../../data").EpiDataRow}
 */
export function findMaxRow(data) {
  let max = null;
  for (const row of data) {
    if (row.value == null) {
      continue;
    }
    if (!max || max.value < row.value) {
      max = row;
    }
  }
  return max;
}

/**
 * @param {import("../../data").EpiDataRow[]} data
 * @returns {import("../../data").EpiDataRow}
 */
export function findMinRow(data) {
  let min = null;
  for (const row of data) {
    if (row.value == null) {
      continue;
    }
    if (!min || min.value > row.value) {
      min = row;
    }
  }
  return min;
}

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

export function toTrendText(delta) {
  if (delta > 2.5) {
    return 'Increasing quickly';
  }
  if (delta > 1) {
    return 'Increasing';
  }
  if (delta < -2.5) {
    return 'Decreasing quickly';
  }
  if (delta < -1) {
    return 'Decreasing';
  }
  return 'Steady';
}
/**
 *
 * @param {Date} date
 * @param {import("../../data").EpiDataRow[]} data
 */
export function determineTrend(date, data, dateRow = findDateRow(date, data)) {
  const refDate = timeDay.offset(date, -7);

  if (!dateRow || dateRow.value == null) {
    return {
      trend: 'Unknown',
      delta: Number.NaN,
      refDate,
      ref: null,
    };
  }
  let refValue = findDateRow(refDate, data);
  if (!refValue) {
    // try the closest before
    const apiDate = toTimeValue(refValue);
    refValue = data.reduce((acc, v) => {
      if (v.time_value > apiDate || v.value == null) {
        return acc;
      }
      if (!acc || acc.time_value < v.time_value) {
        return v;
      }
      return acc;
    }, null);
  }
  if (!refValue) {
    // none found
    return {
      trend: 'Unknown',
      delta: Number.NaN,
      refDate: refDate,
      ref: null,
    };
  }
  const delta = dateRow.value - refValue.value;
  return {
    trend: toTrendText(delta),
    delta,
    refDate: refValue.date_value,
    ref: refValue,
  };
}
