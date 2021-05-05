import { timeDay } from 'd3-time';
import type { EpiDataRow } from '.';
import type { Sensor } from '../stores/constants';
import type { Region, TimeFrame } from '../stores/params';
import { callCorrelationAPI, EpiDataCorrelationRow } from './api';
import { GeoPair, groupBySource, SourceSignalPair } from './apimodel';
import { toTimeValue } from './utils';

export * from './correlationUtils';

export type { EpiDataCorrelationRow } from './api';

export interface CorrelationSummary {
  r2At0: number;
  lagAtMaxR2: number;
  r2AtMaxR2: number;
}

export function fetchCorrelationSummaries(
  reference: Sensor,
  others: readonly Sensor[],
  region: Region,
  window: TimeFrame,
): Promise<Map<string, CorrelationSummary>> {
  const othersGrouped = groupBySource(others);
  return callCorrelationAPI(
    SourceSignalPair.from(reference),
    othersGrouped.map(
      (entry) =>
        new SourceSignalPair(
          entry.source,
          entry.sensors.map((d) => d.signal),
        ),
    ),
    GeoPair.from(region),
    window,
    undefined,
    ['lag', 'r2', 'signal_signal', 'signal_source'],
  ).then((output) => {
    const r = new Map<string, CorrelationSummary>();
    for (const other of others) {
      r.set(other.key, {
        r2At0: 0,
        lagAtMaxR2: 0,
        r2AtMaxR2: 0,
      });
    }
    for (const row of output) {
      const key = `${row.signal_source}-${row.signal_signal}`;
      const entry = r.get(key);
      if (!entry) {
        continue;
      }
      if (row.lag === 0) {
        entry.r2At0 = row.r2;
      }
      if (row.r2 > entry.r2AtMaxR2) {
        entry.lagAtMaxR2 = row.lag;
        entry.r2AtMaxR2 = row.r2;
      }
    }
    return r;
  });
}

export function fetchSingleCorrelations(
  reference: Sensor,
  others: Sensor,
  region: Region,
  window: TimeFrame,
): Promise<Omit<EpiDataCorrelationRow, 'signal_source' | 'signal_signal' | 'geo_value' | 'geo_type'>[]> {
  return callCorrelationAPI(
    SourceSignalPair.from(reference),
    SourceSignalPair.from(others),
    GeoPair.from(region),
    window,
    undefined,
    ['lag', 'r2', 'intercept', 'slope', 'samples'],
  );
}

export interface MergedLaggedRow<T> {
  x: number;
  x_date: Date;
  x_entry: T;
  y: number;
  y_date: Date;
  y_entry: T;
}

function shiftDate(date: Date, lag: number) {
  const shifted = timeDay.offset(date, -lag);
  return toTimeValue(shifted);
}

export function mergeLaggedRows<T extends EpiDataRow>(lag: number, reference: T[], other: T[]): MergedLaggedRow<T>[] {
  const lookup = new Map(other.map((row) => [shiftDate(row.date_value, lag), row]));

  const out: MergedLaggedRow<T>[] = [];
  for (const x of reference) {
    const y = lookup.get(x.time_value);
    if (y) {
      out.push({
        x: x.value,
        x_date: x.date_value,
        x_entry: x,
        y: y.value,
        y_date: y.date_value,
        y_entry: y,
      });
    }
  }
  return out;
}
