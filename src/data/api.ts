import { formatAPITime, formatAPIWeekTime } from './utils';
import type { RegionLevel } from './regions';
import type { TimeFrame } from './TimeFrame';
import { GeoPair, isArray, SourceSignalPair, TimePair } from './apimodel';
import type { EpiWeek } from './EpiWeek';

declare const process: { env: Record<string, string> };

const ENDPOINT = process.env.COVIDCAST_ENDPOINT_URL;

export const CSV_SERVER_ENDPOINT = `${ENDPOINT}/covidcast/csv`;

export const fetchOptions: RequestInit = process.env.NODE_ENV === 'development' ? { cache: 'force-cache' } : {};

export interface EpiDataResponse<T = Record<string, unknown>> {
  result: number;
  message: string;
  epidata: T[];
}

function addParam<T extends { toString(): string }>(url: URL, key: string, pairs: T | readonly T[]): void {
  if (isArray(pairs)) {
    for (const s of pairs) {
      url.searchParams.append(key, s.toString());
    }
  } else {
    url.searchParams.set(key, pairs.toString());
  }
}

export interface EpiDataJSONRow {
  source: string;
  signal: string;

  geo_type: RegionLevel;
  geo_value: string;

  time_type: 'day' | 'week';
  time_value: number;

  value: number;
  stderr?: number;
  sample_size?: number;

  lag: number;
  issue: number;
}

function isExclude<T>(v: unknown): v is { exclude: readonly T[] } {
  return v != null && Array.isArray((v as { exclude: readonly T[] }).exclude);
}

function fetchImpl<T>(url: URL, fields?: readonly string[] | { exclude: readonly string[] }): Promise<T> {
  if (Array.isArray(fields)) {
    url.searchParams.set('fields', fields.join(','));
  } else if (isExclude(fields)) {
    url.searchParams.set('fields', fields.exclude.map((d) => `-${d}`).join(','));
  }

  const urlGetS = url.toString();
  if (urlGetS.length < 4096) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return fetch(url.toString(), fetchOptions).then((d) => d.json());
  }

  const params = new URLSearchParams(url.searchParams);
  url.searchParams.forEach((d) => url.searchParams.delete(d));
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return fetch(url.toString(), {
    ...fetchOptions,
    method: 'POST',
    body: params,
  }).then((d) => d.json());
}

export type FieldSpec<T> = readonly (keyof T)[] | { exclude: readonly (keyof T)[] };

export function callAPI(
  type: 'day' | 'week',
  signal: SourceSignalPair | readonly SourceSignalPair[],
  geo: GeoPair | readonly GeoPair[],
  time: TimePair | readonly TimePair[],
  fields?: FieldSpec<EpiDataJSONRow>,
  { asOf = null as Date | null } = {},
): Promise<EpiDataJSONRow[]> {
  const url = new URL(ENDPOINT + '/covidcast/');
  addParam(url, 'signal', signal);
  addParam(url, 'geo', geo);
  addParam(url, 'time', time);
  if (asOf) {
    url.searchParams.set('as_of', type == 'day' ? formatAPITime(asOf) : formatAPIWeekTime(asOf));
  }
  url.searchParams.set('format', 'json');
  return fetchImpl<EpiDataJSONRow[]>(url, fields).catch((error) => {
    console.warn('failed fetching data', error);
    return [];
  });
}

export interface EpiDataTrendRow {
  geo_type: RegionLevel;
  geo_value: string;

  signal_source: string;
  signal_signal: string;

  date: number;
  value?: number;

  basis_date?: number;
  basis_value?: number;
  basis_trend: 'unknown' | 'increasing' | 'decreasing' | 'steady';

  min_date?: number;
  min_value?: number;
  min_trend: 'unknown' | 'increasing' | 'decreasing' | 'steady';

  max_date?: number;
  max_value?: number;
  max_trend: 'unknown' | 'increasing' | 'decreasing' | 'steady';
}

export function callTrendAPI(
  type: 'week' | 'day',
  signal: SourceSignalPair | readonly SourceSignalPair[],
  geo: GeoPair | readonly GeoPair[],
  date: Date,
  window: TimeFrame,
  basis_shift: number,
  fields?: FieldSpec<EpiDataTrendRow>,
): Promise<EpiDataTrendRow[]> {
  const url = new URL(ENDPOINT + '/covidcast/trend');
  addParam(url, 'signal', signal);
  addParam(url, 'geo', geo);
  url.searchParams.set('date', type === 'day' ? formatAPITime(date) : formatAPIWeekTime(date));
  url.searchParams.set('basis_shift', basis_shift.toString());
  url.searchParams.set('window', window.asTypeRange(type));

  url.searchParams.set('format', 'json');
  return fetchImpl<EpiDataTrendRow[]>(url, fields).catch((error) => {
    console.warn('failed fetching data', error);
    return [];
  });
}

export function callTrendSeriesAPI(
  type: 'week' | 'day',
  signal: SourceSignalPair | readonly SourceSignalPair[],
  geo: GeoPair | readonly GeoPair[],
  window: TimeFrame,
  basis_shift: number,
  fields?: FieldSpec<EpiDataTrendRow>,
): Promise<EpiDataTrendRow[]> {
  const url = new URL(ENDPOINT + '/covidcast/trendseries');
  addParam(url, 'signal', signal);
  addParam(url, 'geo', geo);
  url.searchParams.set('basis_shift', basis_shift.toString());
  url.searchParams.set('window', window.asTypeRange(type));

  url.searchParams.set('format', 'json');
  return fetchImpl<EpiDataTrendRow[]>(url, fields).catch((error) => {
    console.warn('failed fetching data', error);
    return [];
  });
}

export interface EpiDataBackfillRow {
  time_value: number;
  issue: number;

  value: number;
  sample_size?: number;

  value_rel_change?: number;
  sample_size_rel_change?: number;

  is_anchor?: boolean;
  value_completeness?: number;
  sample_size_completeness?: number;
}

export function callBackfillAPI(
  signal: SourceSignalPair,
  time: TimePair,
  geo: GeoPair,
  anchorLag?: number,
  fields?: FieldSpec<EpiDataBackfillRow>,
): Promise<EpiDataBackfillRow[]> {
  const url = new URL(ENDPOINT + '/covidcast/backfill');
  url.searchParams.set('signal', signal.toString());
  url.searchParams.set('geo', geo.toString());
  url.searchParams.set('time', time.toString());

  if (anchorLag != null) {
    url.searchParams.set('anchor_lag', anchorLag.toString());
  }
  url.searchParams.set('format', 'json');
  return fetchImpl<EpiDataBackfillRow[]>(url, fields).catch((error) => {
    console.warn('failed fetching data', error);
    return [];
  });
}

export interface EpiDataMetaStatsInfo {
  min: number;
  max: number;
  mean: number;
  stdev: number;
}

export type SignalCategory = 'public' | 'early' | 'late' | 'other' | 'cases_testing';
export type SignalFormat = 'raw' | 'percent' | 'fraction' | 'per100k' | 'count';
export type SignalHighValuesAre = 'good' | 'bad' | 'neutral';

export interface EpiDataMetaInfo {
  active: boolean;
  source: string;
  signal: string;
  name: string;
  short_description: string;
  description: string;

  category: SignalCategory;
  format: SignalFormat;
  high_values_are: SignalHighValuesAre;

  max_issue: number;
  max_time: number;
  min_time: number;
  geo_types: Record<RegionLevel, EpiDataMetaStatsInfo>;

  is_smoothed: boolean;
  is_weighted: boolean;
  is_cumulative: boolean;
  has_stderr: boolean;
  has_sample_size: boolean;

  based_on_other: boolean;
  signal_basename: string;

  time_label: string;
  time_type: 'day' | 'week';
  value_label: string;

  link: { alt: string; href: string }[];
}

export const KNOWN_LICENSES = {
  'CC BY': {
    link: 'https://creativecommons.org/licenses/by/4.0/',
    name: 'Creative Commons Attribution Licence',
  },
  'CC BY-NC': {
    link: 'https://creativecommons.org/licenses/by-nc/4.0/',
    name: 'Creative Commons Attribution-NonCommercial License',
  },
  ODBL: {
    link: 'https://opendatacommons.org/licenses/odbl/',
    name: 'Open Data Commons Open Database License',
  },
};

export interface EpiDataMetaSourceInfo {
  source: string;
  name: string;
  description: string;
  license: keyof typeof KNOWN_LICENSES | string;

  dua?: string | null;
  link: { alt: string; href: string }[];

  db_source: string;
  reference_signal?: string;

  signals: EpiDataMetaInfo[];
}

export function callMetaAPI(
  signal: SourceSignalPair | readonly SourceSignalPair[] = [],
): Promise<EpiDataMetaSourceInfo[]> {
  const url = new URL(ENDPOINT + '/covidcast/meta');
  addParam(url, 'signal', signal);
  return fetchImpl<EpiDataMetaSourceInfo[]>(url).catch((error) => {
    console.warn('failed fetching data', error);
    return [] as EpiDataMetaSourceInfo[];
  });
}

export interface CoverageRow {
  source: string;
  signal: string;
  time_value: number;
  count: number;
}

export interface ParsedCoverageRow extends CoverageRow {
  date: Date;
  week: EpiWeek;
  fraction: number;
}

export function callCoverageAPI(
  type: 'day' | 'week',
  signal: SourceSignalPair | readonly SourceSignalPair[],
  level?: RegionLevel | 'only-county',
  days?: number,
): Promise<CoverageRow[]> {
  const url = new URL(ENDPOINT + '/covidcast/coverage');
  addParam(url, 'signal', signal);
  if (typeof level === 'string') {
    url.searchParams.set('geo_type', level);
  }
  if (typeof days === 'number') {
    url.searchParams.set(type == 'day' ? 'days' : 'weeks', days.toString());
  }
  url.searchParams.set('format', 'json');
  return fetchImpl<CoverageRow[]>(url).catch((error) => {
    console.warn('failed fetching data', error);
    return [];
  });
}

export interface EpiDataAnomaliesRow {
  problem: string;
  explanation: string;
  source: string;
  signals: string; // * or a comma separated list "*"|(ID{\s*";"\s*ID}*)
  dates: string; // YYYYMMDD-YYYYMMDD or -99 uncertainty days
  regions: string; //semicolor separated key value: e.g. GROUP("*"|(ID{","\s*ID}*)){\s*","\s*GROUP("*"|(ID{","\s*ID}*))}
  reference?: string;
}

export function callAnomaliesAPI(): Promise<EpiDataAnomaliesRow[]> {
  const url = new URL(ENDPOINT + '/covidcast/anomalies');
  url.searchParams.set('format', 'json');
  return fetchImpl<EpiDataAnomaliesRow[]>(url).catch((error) => {
    console.warn('failed fetching data', error);
    return [] as EpiDataAnomaliesRow[];
  });
}
