import { formatAPITime } from './utils';
import { levelMegaCounty } from '../stores/constants';

const ENDPOINT = 'https://api.covidcast.cmu.edu/epidata/api.php';

const fetchOptions = process.env.NODE_ENV === 'development' ? { cache: 'force-cache' } : {};

/**
 * @param {string} endpoint
 * @param {string} id
 * @param {string} signal
 * @param {string} level
 * @param {Date | string} date
 * @param {string} region
 */
export function callAPIEndPoint(endpoint, id, signal, level, date, region) {
  const url = new URL(endpoint || ENDPOINT);
  url.searchParams.set('source', 'covidcast');
  url.searchParams.set('cached', 'true');
  url.searchParams.set('data_source', id);
  url.searchParams.set('signal', signal);
  // mega counties are stored as counties
  url.searchParams.set('geo_type', level === levelMegaCounty.id ? 'county' : level);
  url.searchParams.set('time_values', date instanceof Date ? formatAPITime(date) : date);
  url.searchParams.set('time_type', 'day');
  url.searchParams.set('geo_value', region);
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

export function callMetaAPI() {
  const url = new URL(ENDPOINT);
  url.searchParams.set('source', 'covidcast_meta');
  url.searchParams.set('cached', 'true');
  return fetch(url.toString(), fetchOptions).then((d) => d.json());
}
