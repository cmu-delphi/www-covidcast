import { timeDay } from 'd3-time';
import type { EpiDataRow } from '../data';
import { formatFraction } from '../formats';
import type { Sensor } from './constants';
import { toTimeValue } from './params';

const trendThreshold = 0.1;

export function findMinMaxRow(data: readonly EpiDataRow[]): { min: EpiDataRow | null; max: EpiDataRow | null } {
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
export function findDateRow(date: Date, data: readonly EpiDataRow[], maxIndex = -1): EpiDataRow | undefined {
  const apiDate = toTimeValue(date);

  if (maxIndex >= 0) {
    for (let i = 0; i < Math.min(maxIndex, data.length); i++) {
      if (data[i].time_value === apiDate) {
        return data[i];
      }
    }
    return undefined;
  }
  return data.find((d) => d.time_value === apiDate);
}

function toTrend(current: number, reference: number, min: number) {
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

  highValuesAre: Sensor['highValuesAre'];

  isNeutral: boolean;
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
  minDate: Date | null;
  max: EpiDataRow | null;
  maxDate: Date | null;
  worst: EpiDataRow | null;
  worstDate: Date | null;
  best: EpiDataRow | null;
  bestDate: Date | null;
  minTrend: TrendInfo | null;
  maxTrend: TrendInfo | null;
  worstTrend: TrendInfo | null;
  bestTrend: TrendInfo | null;
}

function computeTrend(
  ref: EpiDataRow,
  current: EpiDataRow,
  min: EpiDataRow,
  highValuesAre: Sensor['highValuesAre'],
): TrendInfo {
  const change = toTrend(current.value, ref.value, min.value);
  const [type, trendText, trendReason] = toTrendText(change);
  const inc = type === 'inc';
  const dec = type === 'dec';
  return {
    trend: trendText,
    isIncreasing: inc,
    isSteady: type === 'steady',
    isDecreasing: dec,
    highValuesAre,
    isBetter: (highValuesAre === 'good' && inc) || (highValuesAre === 'bad' && dec),
    isWorse: (highValuesAre === 'good' && dec) || (highValuesAre === 'bad' && inc),
    isNeutral: highValuesAre === 'neutral' && type !== 'steady',
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
  isNeutral: false,
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
  highValuesAre: 'bad',
  worst: null,
  worstDate: null,
  best: null,
  bestDate: null,
  minTrend: null,
  maxTrend: null,
  bestTrend: null,
  worstTrend: null,
};

export function determineTrend(date: Date, data: readonly EpiDataRow[], highValuesAre: Sensor['highValuesAre']): Trend {
  const { min, max } = findMinMaxRow(data);
  const dateRow = findDateRow(date, data);
  const refDate = timeDay.offset(date, -7);

  const worst = highValuesAre === 'good' ? min : max;
  const best = highValuesAre === 'good' ? max : min;
  const trend: Trend = {
    ...UNKNOWN_TREND,
    refDate,
    min,
    minDate: min ? min.date_value : null,
    max,
    maxDate: max ? max.date_value : null,
    highValuesAre,
    worst,
    worstDate: worst ? worst.date_value : null,
    best,
    bestDate: best ? best.date_value : null,
  };

  if (!dateRow || dateRow.value == null || !min) {
    return trend;
  }
  trend.current = dateRow;
  trend.minTrend = computeTrend(min, dateRow, min, highValuesAre);
  trend.maxTrend = max ? computeTrend(max, dateRow, min, highValuesAre) : null;
  trend.worstTrend = highValuesAre === 'good' ? trend.minTrend : trend.maxTrend;
  trend.bestTrend = highValuesAre === 'good' ? trend.maxTrend : trend.minTrend;

  let refRow = findDateRow(refDate, data);
  if (!refRow) {
    // try the closest before
    const apiDate = toTimeValue(refDate);
    refRow = data.reduce((acc, v) => {
      if (v.time_value > apiDate || v.value == null) {
        return acc;
      }
      if (!acc || acc.time_value < v.time_value) {
        return v;
      }
      return acc;
    }, undefined as undefined | EpiDataRow);
  }
  if (!refRow) {
    // none found
    return trend;
  }
  return {
    ...trend,
    ...computeTrend(refRow, dateRow, min, highValuesAre),
    ref: refRow,
  };
}

export function determineTrends(data: readonly EpiDataRow[], highValuesAre: Sensor['highValuesAre']): TrendInfo[] {
  const { min } = findMinMaxRow(data);

  return data.map(
    (dateRow, i): TrendInfo => {
      const refDate = timeDay.offset(dateRow.date_value, -7);
      const trend = {
        ...UNKNOWN_TREND,
        currentDate: dateRow.date_value,
        current: dateRow,
        refDate,
      };

      if (!min || dateRow.value == null) {
        return trend;
      }
      const refRow = findDateRow(refDate, data, i);
      if (!refRow) {
        return trend;
      }
      return {
        ...trend,
        ...computeTrend(refRow, dateRow, min, highValuesAre),
        ref: refRow,
      };
    },
  );
}
