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
    return ['inc', 'up', `Increasing (>= ${formatFraction(trendThreshold)})`];
  }
  if (change <= -trendThreshold) {
    return ['dec', 'down', `Decreasing (<= ${formatFraction(-trendThreshold)})`];
  }
  return ['steady', 'steady', `Steady (${formatFraction(-trendThreshold)} <= v <= ${formatFraction(trendThreshold)})`];
}

/**
 * @typedef {object} TrendInfo
 * @property {Date} refDate
 * @property {EpiDataRow} ref
 * @property {Date} currentDate
 * @property {EpiDataRow} current
 * @property {string} trend
 * @property {boolean} isIncreasing
 * @property {boolean} isDecreasing
 * @property {boolean} isSteady
 * @property {boolean} isUnknown
 * @property {boolean} isBetter increasing or decreasing based on the inverted state
 * @property {boolean} isWorse increasing or decreasing based on the inverted state
 * @property {string} trendReason
 * @property {number} change normalized change used to compute the trend
 * @property {number} fractionChange non-normalized changed
 * @property {number} delta
 */

/**
 * @typedef {TrendInfo} Trend
 * @property {EpiDataRow} min
 * @property {Date} minDate
 * @property {EpiDataRow} max
 * @property {Date} maxDate
 * @property {EpiDataRow} worst
 * @property {Date} worstDate
 * @property {EpiDataRow} best
 * @property {Date} bestDate
 * @property {TrendInfo} minTrend
 * @property {TrendInfo} maxTrend
 * @property {TrendInfo} worstTrend
 * @property {TrendInfo} bestTrend
 */

function computeTrend(ref, current, min, isInverted) {
  const change = toTrend(current.value, ref.value, min.value);
  const [type, trendText, trendReason] = toTrendText(change);
  const inc = type === 'inc';
  const dec = type === 'dec';
  return {
    trend: trendText,
    isIncreasing: inc,
    isSteady: type === 'steady',
    isDecreasing: dec,
    isBetter: (isInverted && inc) || (!isInverted && dec),
    isWorse: (isInverted && dec) || (!isInverted && inc),
    isUnknown: false,
    trendReason,
    change,
    delta: current.value - ref.value,
    // non normalized change
    fractionChange: ref.value === current.value ? 0 : ref.value === 0 ? 1 : current.value / ref.value - 1,
    ref,
    current,
    refDate: ref.date_value,
    currentDate: current.date_value,
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
  best: null,
  bestDate: null,
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
  const best = isInverted ? max : min;
  const trend = {
    ...UNKNOWN_TREND,
    refDate,
    min,
    minDate: min ? min.date_value : null,
    max,
    maxDate: max ? max.date_value : null,
    worst,
    worstDate: worst ? worst.date_value : null,
    best,
    bestDate: best ? best.date_value : null,
  };

  if (!dateRow || dateRow.value == null) {
    return trend;
  }
  trend.current = dateRow;
  trend.minTrend = computeTrend(min, dateRow, min, isInverted);
  trend.maxTrend = computeTrend(max, dateRow, min, isInverted);
  trend.worstTrend = isInverted ? trend.minTrend : trend.maxTrend;
  trend.bestTrend = isInverted ? trend.maxTrend : trend.minTrend;

  let refRow = findDateRow(refDate, data);
  if (!refRow) {
    // try the closest before
    const apiDate = toTimeValue(refRow);
    refRow = data.reduce((acc, v) => {
      if (v.time_value > apiDate || v.value == null) {
        return acc;
      }
      if (!acc || acc.time_value < v.time_value) {
        return v;
      }
      return acc;
    }, null);
  }
  if (!refRow) {
    // none found
    return trend;
  }
  return {
    ...trend,
    ...computeTrend(refRow, dateRow, min, isInverted),
    ref: refRow,
  };
}
