// Indicator Info: aka The Signal Dashboard API

import { formatAPITime, parseAPITime } from './utils';
import { callSignalAPI } from './api';
import { EpiDataRow, fetchData } from './fetchData';
import { addNameInfos } from './fetchData';
import { countyInfo } from './regions';
import type { RegionInfo } from './regions';
import type { TimeFrame } from '../stores/params';

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
   * completeness value to the given reference anchor lag
   */
  completeness: number;
  /**
   * relative change to the previous issue
   */
  relative_change: number;
  value: number;
}

function toCountProfileEntries(rows: EpiDataRow[], referenceAnchorLag: number): ProfileEntry[] {
  // assume sorted by date asc
  return [];
}

function loadJHUProfile(region: RegionInfo, window: TimeFrame, referenceAnchorLag = 60): Promise<ProfileEntry[]> {
  // currently only supported one
  return fetchData(
    {
      id: 'jhu-csse',
      signal: 'confirmed_incidence_num',
    },
    region.level,
    region.propertyId,
    window.range,
    {
      geo_type: region.level,
      geo_value: region.propertyId,
      signal: 'confirmed_incidence_num',
    },
  ).then((rows) => {
    return toCountProfileEntries(rows, referenceAnchorLag);
  });
}

export function loadBackFillProfile(
  indicator: IndicatorStatus,
  region: RegionInfo,
  window: TimeFrame,
  referenceAnchorLag = 60,
): Promise<ProfileEntry[]> {
  if (indicator.source === 'jhu-csse') {
    return loadJHUProfile(region, window, referenceAnchorLag);
  }
  return Promise.resolve([]);
}
