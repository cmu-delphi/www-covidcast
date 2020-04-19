import { writable, readable, derived } from 'svelte/store';
import * as d3 from 'd3';

// Manually curated list of sensors with metadata.
// Selected so that we know we are able to display them.
// Check https://delphi.cmu.edu/epidata/api.php?source=covidcast_meta
// For updated sensors/API and update this accordingly.
export const sensors = readable([
  {
    name: 'Surveys (Facebook)',
    id: 'fb_survey',
    signal: 'cli',
    levels: ['county', 'msa'],
  },
  {
    name: 'Surveys (Google)',
    id: 'google-survey',
    signal: 'cli',
    levels: ['county', 'state'],
  },
  {
    name: 'Lab Tests (Quidel)',
    id: 'quidel',
    signal: 'negativeprop',
    levels: ['county', 'msa', 'state'],
  },
  {
    name: 'Search Trends (Google)',
    id: 'ght',
    signal: 'smoothedsearch',
    levels: ['msa', 'state'],
  },
]);

export const levels = readable({
  county: 'County',
  state: 'State',
  msa: 'Metropolitan Statistical Area',
});

// This loads all the GeoJSON's for each granularity that the MapBox component reads as layers.
const injectIDs = (level, data) => {
  data.features.forEach((d) => {
    d.properties.level = level;

    if (level === 'county') {
      d.id = d.properties.id = d.properties.GEO_ID.slice(-5);
    } else if (level === 'msa') {
      d.id = d.properties.id = d.properties.cbsafp;
    } else if (level === 'state') {
      d.properties.id = d.properties.POSTAL;
      d.id = d.properties.STATE;
    }
  });
  return data;
};
export const geojsons = readable(new Map(), function start(set) {
  Promise.all([
    d3.json('./maps/albers_usa_gz_2010_us_050_00_5m.json'),
    d3.json('./maps/albers_usa_gz_2010_us_040_00_5m.json'),
    d3.json('./maps/msa-albers.json'),
    d3.json('./maps/city_data/cities-reprojected.json'),
  ]).then(([a, b, c, d]) => {
    let m = new Map();
    m.set('county', injectIDs('county', a));
    m.set('state', injectIDs('state', b));
    m.set('msa', injectIDs('msa', c));
    m.set('city', d);
    set(m);
  });
});

export const times = writable(null);

export const mounted = writable(0);
export const metaData = writable([]);

export const currentSensor = writable('google-survey');
// 'county', 'state', or 'msa'
export const currentLevel = writable('county');
// Options are 'direction' and 'value'.
export const signalType = writable('value');
// EpiWeek in form YYYYMMDD.
export const currentDate = writable(20200412);
// Range of time for the map slider.
export const currentRange = writable([0, 1]);
// Region GEO_ID for filtering the line chart.
export const currentRegion = writable('');
export const currentDataReadyOnMay = writable(false);

export const currentSensorName = derived(
  [sensors, currentSensor],
  ([$sensors, $currentSensor]) => $sensors.filter((item) => item.id === $currentSensor)[0].name,
);
export const currentLevelName = derived([levels, currentLevel], ([$levels, $currentLevel]) => $levels[$currentLevel]);

export const regionSliceCache = writable(new Map());
export const timeSliceCache = writable(new Map());

export const regionData = writable([]);
export const currentData = writable([]);

export const regionDataStats = derived([metaData, currentSensor, currentLevel], ([$meta, $sensor, $level]) =>
  $meta.find((d) => d.data_source === $sensor && d.geo_type === $level),
);
