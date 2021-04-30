import { formatAPITime } from './utils';
import { levelMegaCounty } from '../stores/constants';
import type { DataSensor } from './fetchData';

declare const process: { env: Record<string, string> };

const ENDPOINT = process.env.COVIDCAST_ENDPOINT_URL;

export const fetchOptions: RequestInit = process.env.NODE_ENV === 'development' ? { cache: 'force-cache' } : {};

export interface EpiDataResponse<T = Record<string, unknown>> {
  result: number;
  message: string;
  epidata: T[];
}

export function callAPIEndPoint<T = Record<string, unknown>>(
  id: string,
  signal: string,
  level: string,
  date: Date | [Date, Date] | string,
  region: string | readonly string[],
  fields?: readonly string[],
  format: string | null = null,
): Promise<EpiDataResponse<T>> {
  const url = new URL(ENDPOINT + '/covidcast/');
  url.searchParams.set('signal', `${id}:${signal}`);
  // mega counties are stored as counties
  const timeRange =
    date instanceof Date
      ? formatAPITime(date)
      : Array.isArray(date)
      ? `${formatAPITime(date[0])}-${formatAPITime(date[1])}`
      : date;
  url.searchParams.set('time', `day:${timeRange}`);
  url.searchParams.set(
    'geo',
    `${level === levelMegaCounty.id ? 'county' : level}:${
      Array.isArray(region) ? region.join(',') : (region as string)
    }`,
  );

  if (fields) {
    url.searchParams.set('fields', fields.join(','));
  }
  if (format) {
    url.searchParams.set('format', format);
  }
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return fetch(url.toString(), fetchOptions).then((d) => d.json());
}

/**
 * @param {string} id
 * @param {string} signal
 * @param {string} level
 * @param {Date | string} date
 * @param {string} region
 */
export function callAPI<T = Record<string, unknown>>(
  id: string,
  signal: string,
  level: string,
  date: Date | [Date, Date] | string,
  region: string | readonly string[],
): Promise<EpiDataResponse<T>> {
  return callAPIEndPoint(id, signal, level, date, region);
}

/**
 */
export function callMetaAPI<T = Record<string, unknown>>(
  dataSignals: DataSensor[],
  fields: string[],
  filters: Record<string, string>,
): Promise<EpiDataResponse<T>> {
  const url = new URL(ENDPOINT + '/covidcast_meta/');
  const urlGet = new URL(ENDPOINT + '/covidcast_meta/');
  const data = new FormData();
  if (dataSignals && dataSignals.length > 0) {
    const signals = dataSignals
      .map((d) =>
        d.isCasesOrDeath
          ? Object.values(d.casesOrDeathSignals ?? {})
              .map((s) => `${d.id}:${s}`)
              .join(',')
          : `${d.id}:${d.signal}`,
      )
      .join(',');
    data.set('signals', signals);
    urlGet.searchParams.set('signals', data.get('signals') as string);
  }
  if (fields && fields.length > 0) {
    data.set('fields', fields.join(','));
    urlGet.searchParams.set('fields', data.get('fields') as string);
  }
  Object.entries(filters || {}).forEach((entry) => {
    data.set(entry[0], entry[1]);
    urlGet.searchParams.set(entry[0], entry[1]);
  });

  const urlGetS = urlGet.toString();
  if (urlGetS.length < 4096) {
    // use get
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return fetch(urlGetS, fetchOptions).then((d) => d.json());
  }

  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return fetch(url.toString(), {
    ...fetchOptions,
    method: 'POST',
    body: data,
  }).then((d) => d.json());
}

/**
 *
 * @returns
 */
export function callSignalAPI<T = Record<string, unknown>>(): Promise<EpiDataResponse<T>> {
  const url = new URL(ENDPOINT);
  url.searchParams.set('source', 'signal_dashboard_status');
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return fetch(url.toString(), fetchOptions).then((d) => d.json());
}
