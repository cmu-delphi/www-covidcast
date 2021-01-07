import { timeDay } from 'd3-time';
import { formatAPITime } from '../../data';
import { trendThreshold, trendThresholdQuickly } from './questions';

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

function toTrend(current, reference) {
  return (current - reference) / reference;
}

function toTrendText(change) {
  if (change >= trendThresholdQuickly) {
    return 'increasing quickly';
  }
  if (change >= trendThreshold) {
    return 'increasing';
  }
  if (change <= -trendThresholdQuickly) {
    return 'decreasing quickly';
  }
  if (change <= -trendThreshold) {
    return 'decreasing';
  }
  return 'static';
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
      change: Number.NaN,
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
      change: Number.NaN,
      refDate: refDate,
      ref: null,
    };
  }
  const change = toTrend(dateRow.value, refValue.value);
  return {
    trend: toTrendText(change),
    change,
    refDate: refValue.date_value,
    ref: refValue,
  };
}
