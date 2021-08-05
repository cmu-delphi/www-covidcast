// Indicator Info: aka The Signal Dashboard API

import { parseAPITime } from './utils';
import { callBackfillAPI, callSignalDashboardStatusAPI, EpiDataBackfillRow } from './api';
import type { EpiDataRow } from './fetchData';
import { addNameInfos } from './fetchData';
import { countyInfo } from './regions';
import type { RegionInfo } from './regions';
import fetchTriple from './fetchTriple';
import type { TimeFrame } from './TimeFrame';
import { GeoPair, SourceSignalPair, TimePair } from './apimodel';
import { timeDay } from 'd3-time';
import type { SensorLike } from './meta';

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
      isWeeklySignal: false, // TODO is weekly support
      format: 'raw',
    },
    'county',
    date,
    {
      stderr: false,
    },
  ).then((rows) => addNameInfos(rows).filter((d) => d.level === 'county')); // no mega-counties
}

export interface ProfileEntry extends EpiDataBackfillRow {
  date_value: Date;
  issue_date: Date;
  lag: number;
}

export function loadBackFillProfile(
  sensor: SensorLike,
  region: RegionInfo,
  window: TimeFrame,
  referenceAnchorLag = 60,
): Promise<ProfileEntry[]> {
  return callBackfillAPI(
    SourceSignalPair.from(sensor),
    new TimePair('day', window),
    GeoPair.from(region),
    referenceAnchorLag,
  ).then((rows) => {
    return rows.map((row) => {
      const date = parseAPITime(row.time_value);
      const issue = parseAPITime(row.issue);
      return {
        ...row,
        date_value: date,
        issue_date: issue,
        lag: timeDay.count(date, issue),
      };
    });
  });
}
