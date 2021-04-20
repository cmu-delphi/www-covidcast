// Indicator Info: aka The Signal Dashboard API

import { formatAPITime, parseAPITime } from './utils';
import { callSignalAPI } from './api';
import { EpiDataRow, fetchData } from './fetchData';
import { addNameInfos } from './fetchData';
import { countyInfo } from './regions';
import type { RegionInfo } from './regions';

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
