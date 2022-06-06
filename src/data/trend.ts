import type { EpiDataRow } from './fetchData';
import type { Sensor } from '../stores/constants';
import { callTrendAPI, EpiDataTrendRow, FieldSpec } from './api';
import { GeoPair, SourceSignalPair } from './apimodel';
import type { Region, RegionLevel } from './regions';
import { splitDailyWeekly } from './sensor';
import type { TimeFrame } from './TimeFrame';
import { parseAPITime, toTimeValue } from './utils';
import { timeDay } from 'd3-time';
// import { timeDay } from 'd3-time';

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

export function fetchTrendSR(
  signal: Sensor,
  region: Region,
  date: Date,
  window: TimeFrame,
): Promise<EpiDataTrendRow[]> {
  const geo = GeoPair.from(region);
  let source = SourceSignalPair.from(signal);
  if (signal.overrides && signal.overrides[region.level]) {
    // need to map but no need to unmap since not transferred
    source = SourceSignalPair.from(signal.overrides[region.level]!);
  }
  return callTrendAPI(
    signal.isWeeklySignal ? 'week' : 'day',
    source,
    geo,
    date,
    window,
    signal.isWeeklySignal ? 1 : 7,
    { exclude: ['geo_type', 'geo_value', 'signal_signal', 'signal_source'] },
  );
}

export function fetchTrendR(
  signal: Sensor,
  regions: Region[],
  date: Date,
  window: TimeFrame,
): Promise<EpiDataTrendRow[]> {
  const calls: Promise<EpiDataTrendRow[]>[] = [];
  // for each mapped level
  for (const level of Object.keys(signal.overrides || {})) {
    const levelRegions = regions.filter((d) => d.level === level);
    if (levelRegions.length === 0) {
      continue;
    }
    calls.push(
      callTrendAPI(
        signal.isWeeklySignal ? 'week' : 'day',
        SourceSignalPair.from(signal.overrides![level as RegionLevel]!),
        GeoPair.fromArray(levelRegions),
        date,
        window,
        signal.isWeeklySignal ? 1 : 7,
        {
          exclude: ['signal_signal', 'signal_source'],
        },
      ),
    );
  }
  // all not mapped ones
  const rest = regions.filter((d) => !signal.overrides || signal.overrides[d.level] == null);
  if (rest.length > 0) {
    calls.push(
      callTrendAPI(
        signal.isWeeklySignal ? 'week' : 'day',
        SourceSignalPair.from(signal),
        GeoPair.fromArray(rest),
        date,
        window,
        signal.isWeeklySignal ? 1 : 7,
        {
          exclude: ['signal_signal', 'signal_source'],
        },
      ),
    );
  }

  if (calls.length === 1) {
    return calls[0];
  }
  return Promise.all(calls).then((r) => ([] as EpiDataTrendRow[]).concat(...r));
}

export function fetchTrendS(
  signal: Sensor[],
  region: Region,
  date: Date,
  window: TimeFrame,
): Promise<EpiDataTrendRow[]> {
  const geo = GeoPair.from(region);
  const fields: FieldSpec<EpiDataTrendRow> = { exclude: ['geo_type', 'geo_value'] };

  function fetchMultiSignals(type: 'day' | 'week', sensors: Sensor[]) {
    if (sensors.length === 0) {
      return [];
    }
    const lookup = new Map<string, Sensor>();
    const mapped = sensors.map((s) => {
      const override = s.overrides?.[region.level];
      if (override) {
        lookup.set(`${override.id}@${override.signal}`, s);
        // map forward
        return override;
      }
      return s;
    });
    return callTrendAPI(
      type,
      SourceSignalPair.fromArray(mapped),
      geo,
      date,
      window,
      type == 'week' ? 1 : 7,
      fields,
    ).then((rows) => {
      if (lookup.size === 0) {
        return rows;
      }
      // map back
      for (const row of rows) {
        const key = `${row.signal_source}@${row.signal_signal}`;
        const base = lookup.get(key);
        if (base) {
          row.signal_source = base.id;
          row.signal_signal = base.signal;
        }
      }
      return rows;
    });
  }

  return Promise.all(splitDailyWeekly(signal).map(({ type, sensors }) => fetchMultiSignals(type, sensors))).then((r) =>
    ([] as EpiDataTrendRow[]).concat(...r),
  );
}

export function computeLatest(
  data: EpiDataRow[],
  date: Date,
): {
  value: undefined | number;
  change: undefined | number;
  date: Date;
  refValue: undefined | number;
  refDate: undefined | Date;
} | null {
  if (data.length === 0) {
    return null;
  }
  const timeValue = toTimeValue(date);
  let matchedRow: EpiDataRow | null = null;
  let prevTimeValue = 0;
  let matchedPreviousRow: EpiDataRow | null = null;

  for (let i = data.length - 1; i >= 0; i--) {
    const row = data[i];
    if (row == null || row.value == null || Number.isNaN(row.value)) {
      continue;
    }
    if (matchedRow) {
      if (row.time_value == prevTimeValue) {
        matchedPreviousRow = row;
        break;
      } else if (row.time_value < prevTimeValue) {
        break;
      }
    } else if (row.time_value <= timeValue) {
      matchedRow = row;
      prevTimeValue = toTimeValue(timeDay.offset(row.date_value, -7));
      continue;
    }
  }
  if (!matchedRow) {
    return null;
  }
  return {
    value: matchedRow.value,
    date: matchedRow.date_value,
    change: computeChangeDelta(matchedRow.value, matchedPreviousRow?.value).change,
    refDate: matchedPreviousRow?.date_value,
    refValue: matchedPreviousRow?.value,
  };
}
