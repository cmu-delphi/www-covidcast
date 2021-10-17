import type { Sensor } from '../stores/constants';
import { callTrendAPI, EpiDataTrendRow, FieldSpec } from './api';
import { GeoPair, SourceSignalPair } from './apimodel';
import type { Region } from './regions';
import { splitDailyWeekly } from './sensor';
import type { TimeFrame } from './TimeFrame';
import { parseAPITime } from './utils';

export interface SensorDateTrend {
  date: Date;
  value?: number;

  refDate?: Date;
  refValue?: number;

  change: number;
  delta: number;

  trend: EpiDataTrendRow['basis_trend'];
  highValuesAre: Sensor['highValuesAre'];
}

const UNKNOWN_TREND: Omit<SensorDateTrend, 'date'> = {
  change: Number.NaN,
  delta: Number.NaN,

  trend: 'unknown',
  highValuesAre: 'neutral',
};

export interface SensorTrend extends SensorDateTrend {
  minDate?: Date;
  min?: SensorDateTrend;
  maxDate?: Date;
  max?: SensorDateTrend;
}

function computeChangeDelta(v?: number, base?: number) {
  if (v === base) {
    return { change: 0, delta: 0 };
  }
  if (base == null || base === 0) {
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
    ...computeChangeDelta(value, refValue),
  };
}

function scaled(value: number | undefined, factor = 1) {
  if (factor === 1) {
    return value;
  }
  if (value == null) {
    return value;
  }
  return value * factor;
}

export function asSensorTrend(
  date: Date,
  highValuesAre: Sensor['highValuesAre'],
  row?: EpiDataTrendRow,
  { factor = 1 } = {},
): SensorTrend {
  let t: SensorTrend = {
    ...UNKNOWN_TREND,
    date,
  };
  if (!row) {
    return t;
  }
  t.value = scaled(row.value, factor);

  if (row.basis_date != null) {
    t = asSensorDateTrend(
      date,
      t.value,
      row.basis_date,
      scaled(row.basis_value, factor),
      row.basis_trend,
      highValuesAre,
    );
  }
  if (row.max_date != null) {
    t.max = asSensorDateTrend(date, t.value, row.max_date, scaled(row.max_value, factor), row.max_trend, highValuesAre);
    t.maxDate = t.max.refDate;
  }
  if (row.min_date != null) {
    t.min = asSensorDateTrend(date, t.value, row.min_date, scaled(row.min_value, factor), row.min_trend, highValuesAre);
    t.minDate = t.min.refDate;
  }
  return t;
}

export function fetchTrend(
  signal: Sensor | Sensor[],
  region: Region | Region[],
  date: Date,
  window: TimeFrame,
  fields?: FieldSpec<EpiDataTrendRow>,
): Promise<EpiDataTrendRow[]> {
  const geo = Array.isArray(region) ? GeoPair.fromArray(region) : GeoPair.from(region);
  if (!Array.isArray(signal)) {
    return callTrendAPI(
      signal.isWeeklySignal ? 'week' : 'day',
      SourceSignalPair.from(signal),
      geo,
      date,
      window,
      signal.isWeeklySignal ? 1 : 7,
      fields,
    );
  }
  return Promise.all(
    splitDailyWeekly(signal).map(({ type, sensors }) =>
      sensors.length === 0
        ? []
        : callTrendAPI(type, SourceSignalPair.fromArray(sensors), geo, date, window, type == 'week' ? 1 : 7, fields),
    ),
  ).then((r) => ([] as EpiDataTrendRow[]).concat(...r));
}
