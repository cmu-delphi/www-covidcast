const ENDPOINT = 'https://api.covidcast.cmu.edu/epidata/api.php';
const ENDPOINT_META = 'https://api.covidcast.cmu.edu/epidata/api.php?source=covidcast_meta&cached=true';

export function callAPI(id, signal, level, date, region) {
  const url = new URL(ENDPOINT);
  url.searchParams.set('source', 'covidcast');
  url.searchParams.set('cached', 'true');
  url.searchParams.set('data_source', id);
  url.searchParams.set('signal', signal);
  url.searchParams.set('geo_type', level);
  url.searchParams.set('time_values', date);
  url.searchParams.set('time_type', 'day');
  url.searchParams.set('geo_value', region);
  return fetch(url.toString()).then((d) => d.json());
}

export function callMetaAPI() {
  const url = new URL(ENDPOINT_META);
  url.searchParams.set('source', 'covidcast_meta');
  url.searchParams.set('cached', 'true');
  return fetch(url.toString()).then((d) => d.json());
}
