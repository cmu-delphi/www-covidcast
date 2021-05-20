// Indicator Info: aka The Signal Dashboard API

import { parseAPITime } from './utils';
import { callSignalDashboardStatusAPI } from './api';
import type { EpiDataRow } from './fetchData';
import { addNameInfos } from './fetchData';
import { countyInfo } from './regions';
import type { RegionInfo } from './regions';
import fetchTriple from './fetchTriple';

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
  return callSignalDashboardStatusAPI().then((d) => {
    const data = d as unknown as IndicatorStatus[];
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
  return fetchTriple(
    {
      id: indicator.source,
      signal: indicator.covidcast_signal,
      format: 'raw',
    },
    'county',
    date,
    {
      stderr: false,
    },
  ).then((rows) => addNameInfos(rows).filter((d) => d.level === 'county')); // no mega-counties
}
