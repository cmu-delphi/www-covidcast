import { formatAPITime } from './utils';
import { levelMegaCounty } from '../stores/constants';

const ENDPOINT = process.env.COVIDCAST_ENDPOINT_URL;

const fetchOptions = process.env.NODE_ENV === 'development' ? { cache: 'force-cache' } : {};

/**
 * @param {string | (id: string, signal: string, level: string, date: Date | string, region: string) => any} endpoint
 * @param {string} id
 * @param {string} signal
 * @param {string} level
 * @param {Date | string | [Date, Date]} date
 * @param {string|string[]} region
 */
export function callAPIEndPoint(endpoint, id, signal, level, date, region, fields, format = null) {
  if (typeof endpoint === 'function') {
    return Promise.resolve(endpoint(id, signal, level, date, region, fields));
  }
  const url = new URL(endpoint || ENDPOINT);
  url.searchParams.set('source', 'covidcast');
  url.searchParams.set('data_source', id);
  url.searchParams.set('signal', signal);
  // mega counties are stored as counties
  url.searchParams.set('geo_type', level === levelMegaCounty.id ? 'county' : level);
  url.searchParams.set(
    'time_values',
    date instanceof Date
      ? formatAPITime(date)
      : Array.isArray(date)
      ? `${formatAPITime(date[0])}-${formatAPITime(date[1])}`
      : date,
  );
  url.searchParams.set('time_type', 'day');
  if (Array.isArray(region) || region.includes(',')) {
    url.searchParams.set('geo_values', Array.isArray(region) ? region.join(',') : region);
  } else {
    url.searchParams.set('geo_value', region);
  }
  if (fields) {
    url.searchParams.set('fields', fields.join(','));
  }
  if (format) {
    url.searchParams.set('format', format);
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
 * @param {import('.').DataSensor[]} dataSignals
 * @param {string[]} fields
 * @param {Record<string, string>} filters
 */
function callMetaAPIImpl(endpoint, dataSignals, fields, filters) {
  const url = new URL(endpoint || ENDPOINT);
  const urlGet = new URL(endpoint || ENDPOINT);
  const data = new FormData();
  data.set('source', 'covidcast_meta');
  urlGet.searchParams.set('source', data.get('source'));

  if (dataSignals && dataSignals.length > 0) {
    const signals = dataSignals
      .map((d) =>
        d.isCasesOrDeath
          ? Object.values(d.casesOrDeathSignals)
              .map((s) => `${d.id}:${s}`)
              .join(',')
          : `${d.id}:${d.signal}`,
      )
      .join(',');
    data.set('signals', signals);
    urlGet.searchParams.set('signals', data.get('signals'));
  }
  if (fields && fields.length > 0) {
    data.set('fields', fields.join(','));
    urlGet.searchParams.set('fields', data.get('fields'));
  }
  Object.entries(filters || {}).forEach((entry) => {
    data.set(entry[0], entry[1]);
    urlGet.searchParams.set(entry[0], entry[1]);
  });

  const urlGetS = urlGet.toString();
  if (urlGetS.length < 4096) {
    // use get
    return fetch(urlGetS, fetchOptions).then((d) => d.json());
  }

  return fetch(url.toString(), {
    ...fetchOptions,
    method: 'POST',
    body: data,
  }).then((d) => d.json());
}

/**
 *
 * @param {import('.').DataSensor[]} dataSignals
 * @param {string[]} fields
 * @param {Record<string, string>} filters
 */
export function callMetaAPI(sensors, fields, filters) {
  // group by api string
  const map = new Map();
  for (const sensor of sensors) {
    const endpoint = sensor.api || ENDPOINT;
    if (map.has(endpoint)) {
      map.get(endpoint).push(sensor);
    } else {
      map.set(endpoint, [sensor]);
    }
  }
  if (map.size === 1) {
    const first = Array.from(map.entries())[0];
    return callMetaAPIImpl(first[0], first[1], fields, filters);
  }
  return Promise.all(
    Array.from(map.entries()).map(([endpoint, groupedSensors]) =>
      callMetaAPIImpl(endpoint, groupedSensors, fields, filters),
    ),
  ).then((metas) => metas.flat());
}
