import { timeDay } from 'd3-time';
import { formatFraction } from '../formats';
import { toTimeValue } from './params';

const trendThreshold = 0.1;

/**
 * @param {import("../../data").EpiDataRow[]} data
 * @returns {[import("../../data").EpiDataRow, import("../../data").EpiDataRow]}
 */
export function findMinMaxRow(data) {
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
  return { min, max };
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
    return ['increasing', `Increasing (>= ${formatFraction(trendThreshold)})`];
  }
  if (change <= -trendThreshold) {
    return ['decreasing', `Decreasing (<= ${formatFraction(trendThreshold)})`];
  }
  return ['steady', `Steady (${formatFraction(-trendThreshold)} <= v <= ${formatFraction(trendThreshold)})`];
}

/**
 * @typedef {object} TrendInfo
 * @property {string} trend
 * @property {boolean} isIncreasing
 * @property {boolean} isDecreasing
 * @property {boolean} isSteady
 * @property {boolean} isUnknown
 * @property {boolean} isBetter increasing or decreasing based on the inverted state
 * @property {boolean} isWorse increasing or decreasing based on the inverted state
 * @property {string} trendReason
 * @property {number} change
 * @property {number} delta
 */

/**
 * @typedef {TrendInfo} Trend
 * @property {Date} refDate
 * @property {EpiDataRow} ref
 * @property {EpiDataRow} current
 * @property {EpiDataRow} min
 * @property {Date} minDate
 * @property {EpiDataRow} max
 * @property {Date} maxDate
 * @property {EpiDataRow} worst
 * @property {Date} worstDate
 * @property {TrendInfo} minTrend
 * @property {TrendInfo} maxTrend
 * @property {TrendInfo} worstTrend
 */

function computeTrend(ref, current, min, isInverted) {
  const change = toTrend(current, ref, min);
  const [trendText, trendReason] = toTrendText(change);
  const inc = trendText.startsWith('inc');
  const dec = trendText.startsWith('dec');
  return {
    trend: trendText,
    isIncreasing: inc,
    isSteady: trendText.startsWith('steady'),
    isDecreasing: dec,
    isBetter: (isInverted && inc) || (!isInverted && dec),
    isWorse: (isInverted && dec) || (!isInverted && inc),
    isUnknown: false,
    trendReason,
    change,
    delta: current - ref,
  };
}

export const UNKNOWN_TREND = {
  trend: 'Unknown',
  isIncreasing: false,
  isSteady: false,
  isDecreasing: false,
  isUnknown: true,
  trendReason: 'Unknown',
  change: Number.NaN,
  delta: Number.NaN,
  refDate: new Date(),
  ref: null,
  min: null,
  max: null,
  minDate: null,
  maxDate: null,
  worst: null,
  worstDate: null,
};
/**
 *
 * @param {Date} date
 * @param {import("../../data").EpiDataRow[]} data
 */
export function determineTrend(date, data, isInverted = false) {
  const { min, max } = findMinMaxRow(data);
  const dateRow = findDateRow(date, data);
  const refDate = timeDay.offset(date, -7);

  const worst = isInverted ? min : max;
  const trend = {
    ...UNKNOWN_TREND,
    refDate,
    min,
    minDate: min ? min.date_value : null,
    max,
    maxDate: max ? max.date_value : null,
    worst,
    worstDate: worst ? worst.date_value : null,
  };

  if (!dateRow || dateRow.value == null) {
    return trend;
  }
  trend.current = dateRow;
  trend.minTrend = computeTrend(min.value, dateRow.value, min.value, isInverted);
  trend.maxTrend = computeTrend(max.value, dateRow.value, min.value, isInverted);
  trend.worstTrend = isInverted ? trend.minTrend : trend.maxTrend;

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
    return trend;
  }
  return {
    ...trend,
    ...computeTrend(refValue.value, dateRow.value, min.value, isInverted),
    ref: refValue,
  };
}
