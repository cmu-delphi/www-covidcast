import { timeDay } from 'd3-time';
import { format } from 'd3-format';
import { toTimeValue } from './params';

const trendThreshold = 0.1;

const f = format('.1f');

export function formatTrendChange(change, enforceSign = false) {
  if (change == null || Number.isNaN(change)) {
    return 'N/A';
  }
  if (enforceSign) {
    return `${change > 0 ? '+' : ''}${f(change * 100)}%`;
  }
  return `${f(Math.abs(change) * 100)}%`;
}

/**
 * @param {import("../../data").EpiDataRow[]} data
 * @returns {[import("../../data").EpiDataRow, import("../../data").EpiDataRow]}
 */
function findMinMaxRow(data) {
  let min = null;
  let max = null;
  for (const row of data) {
    if (row.value == null) {
      continue;
    }
    if (!min || min.value > row.value) {
      min = row;
    }
    if (!max || max.value < row.value) {
      max = row;
    }
  }
  return [min, max];
}

/**
 * @param {Date} date
 * @param {import("../../data").EpiDataRow[]} data
 */
export function findDateRow(date, data) {
  const apiDate = toTimeValue(date);
  return data.find((d) => d.time_value === apiDate);
}

function toTrend(current, reference, min) {
  const nRef = reference - min;
  const nCur = current - min;
  if (nCur === nRef) {
    return 0;
  }
  if (nRef === 0) {
    return 1;
  }
  return nCur / nRef - 1;
}

function toTrendText(change) {
  if (change >= trendThreshold) {
    return ['increase', `Increasing (>= ${formatTrendChange(trendThreshold)})`];
  }
  if (change <= -trendThreshold) {
    return ['decrease', `Decreasing (<= ${formatTrendChange(trendThreshold)})`];
  }
  return ['static', `Static (${formatTrendChange(-trendThreshold)} <= v <= ${formatTrendChange(trendThreshold)})`];
}

/**
 * @typedef {object} Trend
 * @property {string} trend
 * @property {boolean} isIncreasing
 * @property {boolean} isDecreasing
 * @property {boolean} isStatic
 * @property {boolean} isUnknown
 * @property {string} trendReason
 * @property {number} change
 * @property {number} delta
 * @property {Date} refDate
 * @property {EpiDataRow} ref
 * @property {EpiDataRow} current
 * @property {EpiDataRow} min
 */

export const UNKNOWN_TREND = {
  trend: 'Unknown',
  isIncreasing: false,
  isStatic: false,
  isDecreasing: false,
  isUnknown: true,
  trendReason: 'Unknown',
  change: Number.NaN,
  delta: Number.NaN,
  refDate: new Date(),
  ref: null,
  min: null,
};
/**
 *
 * @param {Date} date
 * @param {import("../../data").EpiDataRow[]} data
 */
export function determineTrend(date, data, dateRow = findDateRow(date, data)) {
  const refDate = timeDay.offset(date, -7);

  if (!dateRow || dateRow.value == null) {
    return {
      ...UNKNOWN_TREND,
      refDate,
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
  const [min, max] = findMinMaxRow(data);
  if (!refValue) {
    // none found
    return {
      ...UNKNOWN_TREND,
      current: dateRow,
      refDate: refDate,
      min,
      max,
    };
  }
  const change = toTrend(dateRow.value, refValue.value, min.value);
  const [trendText, trendReason] = toTrendText(change);
  return {
    trend: trendText,
    isIncreasing: trendText.startsWith('inc'),
    isStatic: trendText === 'static',
    isDecreasing: trendText.startsWith('dec'),
    isUnknown: false,
    trendReason,
    change,
    delta: dateRow.value - refValue.value,
    refDate: refValue.date_value,
    current: dateRow,
    ref: refValue,
    min,
    max,
  };
}
