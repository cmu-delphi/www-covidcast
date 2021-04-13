// Indicator Info: aka The Signal Dashboard API

import { formatAPITime, parseAPITime } from './utils';
import { callSignalAPI } from './api';
import { EpiDataRow, fetchData } from './fetchData';
import { addNameInfos } from '.';
import { countyInfo } from '../maps/infos';
import type { RegionInfo } from '../maps/interfaces';
import type { TimeFrame } from '../stores/params';
import data from './__test__/backfill/chng_sample_ny.json';
import { timeDay } from 'd3-time';

export interface Coverage {
  date: Date;
  count: number;
  fraction: number;
}

export interface IndicatorStatus {
  id: string;
  name: string;
  source: string;
  covidcast_signal: string;
  latest_issue: Date;
  latest_time_value: Date;
  coverage: Record<'county', Coverage[]>;
}

function parseFakeISO(value: number | string | Date): Date {
  return parseAPITime(value.toString().replace(/-/gm, ''));
}

export function getIndicatorStatuses(): Promise<IndicatorStatus[]> {
  return callSignalAPI<Record<keyof IndicatorStatus, string>>().then((d) => {
    if (d.result == null || d.result < 0 || d.message.includes('no results')) {
      return [];
    }
    const data = ((d.epidata ?? []) as unknown) as IndicatorStatus[];
    for (const row of data) {
      row.id = row.name.toLowerCase().replace(/\s/g, '-');
      row.latest_issue = parseFakeISO(row.latest_issue);
      row.latest_time_value = parseFakeISO(row.latest_time_value);
      Object.values(row.coverage).forEach((level) => {
        for (const row of level) {
          row.date = parseFakeISO(row.date);
          row.fraction = row.count / countyInfo.length;
        }
      });
    }
    return data;
  });
}

export function getAvailableCounties(indicator: IndicatorStatus, date: Date): Promise<(EpiDataRow & RegionInfo)[]> {
  return fetchData(
    {
      id: indicator.source,
      signal: indicator.covidcast_signal,
    },
    'county',
    '*',
    date,
    { time_value: Number.parseInt(formatAPITime(date), 10) },
    {
      multiValues: false,
    },
  ).then((rows) => addNameInfos(rows).filter((d) => d.level === 'county'));
}

export interface ProfileEntry {
  time_value: number;
  date_value: Date;
  issue_date: Date;
  lag: number;
  /**
   * [0..1]
   */
  confidence: number;
  value: number;
}

export function loadBackFillProfile(indicator: IndicatorStatus, window: TimeFrame): Promise<ProfileEntry[]> {
  if (indicator.name !== 'Change' || window.min < new Date(2020, 0, 1)) {
    return Promise.resolve([]);
  }
  let latest = data[0];
  const rows: ProfileEntry[] = data.map((d) => {
    if (d.time_value !== latest.time_value) {
      latest = d; // sorted like that the lag desc = max
    }
    const date = parseFakeISO(d.time_value);
    return {
      date_value: date,
      time_value: d.time_value,
      lag: d.lag,
      issue_date: timeDay.offset(date, d.lag),
      confidence: d.sample_size / latest.sample_size,
      value: d.value,
    };
  });
  return Promise.resolve(rows);
}
