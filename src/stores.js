import { writable, readable, derived } from 'svelte/store';
import * as d3 from 'd3';

const ENDPOINT = 'https://delphi.cmu.edu/epidata/api.php?source=covidcast&time_type=day';

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
    levels: ['county', 'msa'],
  },
  {
    name: 'Search Trends (Google)',
    id: 'ght',
    signal: 'smoothedsearch',
    levels: ['msa'],
  },
]);

export const levels = readable({
  county: 'County',
  state: 'State',
  msa: 'Metropolitan Statistical Area',
});

// This loads all the GeoJSON's for each granularity that the MapBox component reads as layers.
export const geojsons = readable(new Map(), function start(set) {
  Promise.all([
    d3.json('./maps/albers_usa_gz_2010_us_050_00_5m.json'),
    d3.json('./maps/albers_usa_gz_2010_us_040_00_5m.json'),
    d3.json('./maps/albers_usa_tl_2019_us_metdiv.json'),
  ]).then(([a, b, c, d]) => {
    let m = new Map();
    m.set('county', a);
    m.set('state', b);
    m.set('msa', c);
    set(m);
  });
});

export const times = writable(null);
export const dates = writable();

export const mounted = writable(0);
export const metaData = writable([]);

export const currentSensor = writable('google-survey');
export const currentSensorName = derived(
  [sensors, currentSensor],
  ([$sensors, $currentSensor]) => $sensors.filter((item) => item.id === $currentSensor)[0].name,
);
// 'county', 'state', or 'msa'
export const currentLevel = writable('county');
export const currentLevelName = derived([levels, currentLevel], ([$levels, $currentLevel]) => $levels[$currentLevel]);
// Options are 'direction' and 'value'.
export const signalType = writable('direction');
// EpiWeek in form YYYYMMDD.
export const currentDate = writable(20200412);
// Range of time for the map slider.
export const currentRange = writable([0, 1]);
// Region GEO_ID for filtering the line chart.
export const currentRegion = writable('');
export const currentDataReadyOnMay = writable(false);

export const regionSliceCache = writable(new Map());
export const timeSliceCache = writable(new Map());

export const data = writable([]);
export const regionData = writable([]);
export const currentData = writable([]);

export const regionDataStats = derived([metaData, currentSensor, currentLevel], ([$meta, $sensor, $level]) => {
  console.log($meta, $sensor, $level);
  return $meta.find((d) => d.data_source === $sensor && d.geo_type === $level);
});

// regionDataStats[0] is hopefully going to give you the min/max. for example:
/**
 * {
      "data_source": "google-survey",
      "signal": "cli",
      "time_type": "day",
      "geo_type": "county",
      "min_time": 20200411,
      "max_time": 20200416,
      "num_locations": 599,
      "min_value": 0.026455026455026,
      "max_value": 0.31923076923077
    },
 */
// export const regionDataStats = derived(
//   [data, sensors, currentSensor, currentLevel, currentRegion, metaStats],
//   ([$data, $sensors, $sensor, $level, $region, $metaStats]) => {
//     if ($data && $region && $metaStats) {
//       let currDat = $data[$sensor][$level];
//       let level = currDat ? $level : $sensors.find((d) => d.id === $sensor).levels[0];
//       return $metaStats.filter((item) => item.data_source === $sensor && item.geo_type === $level);
//     } else return [];
//   },
// );
