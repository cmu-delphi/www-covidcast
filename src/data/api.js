import { formatAPITime } from './utils';

const ENDPOINT = 'https://api.covidcast.cmu.edu/epidata/api.php';

const fetchOptions = process.env.NODE_ENV === 'development' ? { cache: 'force-cache' } : {};

/**
 * @param {string | (id: string, signal: string, level: string, date: Date | string, region: string) => any} endpoint
 * @param {string} id
 * @param {string} signal
 * @param {string} level
 * @param {Date | string} date
 * @param {string} region
 */
export function callAPIEndPoint(endpoint, id, signal, level, date, region, fields) {
  if (typeof endpoint === 'function') {
    return Promise.resolve(endpoint(id, signal, level, date, region, fields));
  }
  const url = new URL(endpoint || ENDPOINT);
  url.searchParams.set('source', 'covidcast');
  url.searchParams.set('cached', 'true');
  url.searchParams.set('data_source', id);
  url.searchParams.set('signal', signal);
  url.searchParams.set('geo_type', level);
  url.searchParams.set('time_values', date instanceof Date ? formatAPITime(date) : date);
  url.searchParams.set('time_type', 'day');
  url.searchParams.set('geo_value', region);
  if (fields) {
    url.searchParams.set('fields', fields.join(','));
  }
  return fetch(url.toString(), fetchOptions).then((d) => d.json());
}

/**
 * @param {string} id
 * @param {string} signal
 * @param {string} level
 * @param {Date | string} date
 * @param {string} region
 */
export function callAPI(id, signal, level, date, region) {
  return callAPIEndPoint(ENDPOINT, id, signal, level, date, region);
}

/**
 *
 * @param {import('.').SensorEntry[]} sensors
 * @param {string[]} fields
 * @param {Record<string, string>} filters
 */
export function callMetaAPI(sensors, fields, filters) {
  const url = new URL(ENDPOINT);
  const data = new FormData();
  data.set('source', 'covidcast_meta');
  data.set('cached', 'true');
  data.set('signals', sensors.map((d) => `${d.id}:${d.signal}`).join(','));
  data.set('fields', fields.join(','));
  Object.entries(filters).forEach((entry) => data.set(entry[0], entry[1]));
  return fetch(url.toString(), {
    ...fetchOptions,
    method: 'POST',
    body: data,
  }).then((d) => d.json());
}
