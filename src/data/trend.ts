import type { Sensor } from '../stores/constants';
import type { EpiDataTrendRow } from './api';
import { parseAPITime } from './utils';

export interface SensorDateTrend {
  date: Date;
  value?: number;

  refDate?: Date;
  refValue?: number;

  change: number;
  delta: number;

  trend: EpiDataTrendRow['basis_trend'];
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
}

const UNKNOWN_TREND: Omit<SensorDateTrend, 'date'> = {
  change: Number.NaN,
  delta: Number.NaN,

  trend: 'unknown',
  isUnknown: true,
  isBetter: false,
  isIncreasing: false,
  isDecreasing: false,
  highValuesAre: 'neutral',
  isNeutral: false,
  isSteady: false,
  isWorse: false,
};

export interface SensorTrend extends SensorDateTrend {
  minDate?: Date;
  min?: SensorDateTrend;
  maxDate?: Date;
  max?: SensorDateTrend;
  bestDate?: Date;
  best?: SensorDateTrend;
  worstDate?: Date;
  worst?: SensorDateTrend;
}

function computeChangeDelta(v?: number, base?: number) {
  if (v === base) {
    return { change: 0, delta: 0 };
  }
  if (base == null) {
    return { change: 1, delta: v ?? 0 };
  }
  if (v == null) {
    return { change: 0, delta: 0 };
  }
  return {
    change: v / base - 1,
    delta: v - base,
  };
}

function asSensorDateTrend(
  date: Date,
  value: number | undefined,
  refDate: number,
  refValue: number | undefined,
  refTrend: EpiDataTrendRow['basis_trend'],
  highValuesAre: Sensor['highValuesAre'],
): SensorDateTrend {
  return {
    date,
    value,
    highValuesAre,
    refDate: parseAPITime(refDate),
    refValue,
    trend: refTrend,
    isIncreasing: refTrend === 'increasing',
    isDecreasing: refTrend === 'decreasing',
    isBetter:
      (highValuesAre === 'good' && refTrend === 'increasing') || (highValuesAre === 'bad' && refTrend === 'decreasing'),
    isWorse:
      (highValuesAre === 'good' && refTrend === 'decreasing') || (highValuesAre === 'bad' && refTrend === 'increasing'),
    isUnknown: refTrend === 'unknown',
    isSteady: refTrend === 'steady',
    isNeutral: highValuesAre === 'neutral' && (refTrend === 'increasing' || refTrend === 'decreasing'),
    ...computeChangeDelta(value, refValue),
  };
}

export function asSensorTrend(date: Date, highValuesAre: Sensor['highValuesAre'], row?: EpiDataTrendRow): SensorTrend {
  let t: SensorTrend = {
    ...UNKNOWN_TREND,
    date,
  };
  if (!row) {
    return t;
  }
  t.value = row.value;

  if (row.basis_date != null) {
    t = asSensorDateTrend(date, row.value, row.basis_date, row.basis_value, row.basis_trend, highValuesAre);
  }
  if (row.max_date != null) {
    t.max = asSensorDateTrend(date, row.value, row.max_date, row.max_value, row.max_trend, highValuesAre);
    t.maxDate = t.max.refDate;
  }
  if (row.min_date != null) {
    t.min = asSensorDateTrend(date, row.value, row.min_date, row.min_value, row.min_trend, highValuesAre);
    t.minDate = t.min.refDate;
  }
  t.best = highValuesAre === 'good' ? t.max : t.min;
  t.bestDate = highValuesAre === 'good' ? t.maxDate : t.minDate;
  t.worst = highValuesAre === 'good' ? t.min : t.max;
  t.worstDate = highValuesAre === 'good' ? t.minDate : t.maxDate;
  return t;
}
