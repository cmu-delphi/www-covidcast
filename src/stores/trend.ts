import { timeDay } from 'd3-time';
import type { EpiDataRow } from '../data';
import { formatFraction } from '../formats';
import { toTimeValue } from './params';

const trendThreshold = 0.1;

/**
 * @returns {[import("../../data").EpiDataRow, import("../../data").EpiDataRow]}
 */
export function findMinMaxRow(data: readonly EpiDataRow[]): { min: EpiDataRow; max: EpiDataRow } {
  let min: EpiDataRow | null = null;
  let max: EpiDataRow | null = null;
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
export function findDateRow(date: Date, data: readonly EpiDataRow[]): EpiDataRow | undefined {
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

function toTrendText(change: number): ['inc' | 'dec' | 'steady', string, string] {
  if (change >= trendThreshold) {
    return ['inc', 'up', `Increasing (>= ${formatFraction(trendThreshold)})`];
  }
  if (change <= -trendThreshold) {
    return ['dec', 'down', `Decreasing (<= ${formatFraction(-trendThreshold)})`];
  }
  return ['steady', 'steady', `Steady (${formatFraction(-trendThreshold)} <= v <= ${formatFraction(trendThreshold)})`];
}

export interface TrendInfo {
  refDate: Date;
  ref: EpiDataRow | null;
  currentDate: Date;
  current: EpiDataRow | null;
  trend: string;
  isIncreasing: boolean;
  isDecreasing: boolean;
  isSteady: boolean;
  isUnknown: boolean;
  /**
   * increasing or decreasing based on the inverted state
   */
  isBetter: boolean;
  /**
   * increasing or decreasing based on the inverted state
   */
  isWorse: boolean;
  trendReason: string;
  /**
   * normalized change used to compute the trend
   */
  change: number;
  /**
   * non-normalized changed
   */
  fractionChange: number;

  delta: number;
}

export interface Trend extends TrendInfo {
  min: EpiDataRow | null;
  minDate: Date;
  max: EpiDataRow | null;
  maxDate: Date;
  worst: EpiDataRow | null;
  worstDate: Date;
  best: EpiDataRow | null;
  bestDate: Date;
  minTrend: TrendInfo | null;
  maxTrend: TrendInfo | null;
  worstTrend: TrendInfo | null;
  bestTrend: TrendInfo | null;
}

function computeTrend(ref: EpiDataRow, current: EpiDataRow, min: EpiDataRow, isInverted: boolean): TrendInfo {
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

export const UNKNOWN_TREND: Trend = {
  trend: 'Unknown',
  isIncreasing: false,
  isSteady: false,
  isDecreasing: false,
  isUnknown: true,
  isBetter: false,
  isWorse: false,
  current: null,
  currentDate: new Date(),
  trendReason: 'Unknown',
  change: Number.NaN,
  fractionChange: Number.NaN,
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
  minTrend: null,
  maxTrend: null,
  bestTrend: null,
  worstTrend: null,
};

export function determineTrend(date: Date, data: readonly EpiDataRow[], isInverted = false): Trend {
  const { min, max } = findMinMaxRow(data);
  const dateRow = findDateRow(date, data);
  const refDate = timeDay.offset(date, -7);

  const worst = isInverted ? min : max;
  const best = isInverted ? max : min;
  const trend: Trend = {
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
