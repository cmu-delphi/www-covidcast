// Indicator Info: aka The Signal Dashboard API

import { formatAPITime } from './utils';
import { callSignalAPI } from './api';
import { EpiDataRow, fetchData } from './fetchData';
import { isoParse } from 'd3-time-format';
import { timeDay } from 'd3-time';
import { addNameInfos } from '.';
import { countyInfo } from '../maps';
import type { NameInfo } from '../maps/interfaces';

export interface Coverage {
  date: Date;
  count: number;
  fraction: number;
}

export interface IndicatorStatus {
  name: string;
  source: string;
  covidcast_signal: string;
  latest_issue: Date;
  latest_time_value: Date;
  coverage: Record<'county', Coverage[]>;
}

export function getIndicatorStatuses(): Promise<IndicatorStatus[]> {
  return callSignalAPI<Record<keyof IndicatorStatus, string>>().then((d) => {
    if (d.result < 0 || d.message.includes('no results')) {
      return [];
    }
    const data = ((d.epidata ?? []) as unknown) as IndicatorStatus[];
    for (const row of data) {
      row.latest_issue = timeDay(isoParse(row.latest_issue.toString()));
      row.latest_time_value = timeDay(isoParse(row.latest_time_value.toString()));
      Object.values(row.coverage).forEach((level) => {
        for (const row of level) {
          row.date = timeDay(isoParse(row.date.toString()));
          row.fraction = row.count / countyInfo.length;
        }
      });
    }
    return data;
  });
}

export function getAvailableCounties(indicator: IndicatorStatus, date: Date): Promise<(EpiDataRow & NameInfo)[]> {
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
