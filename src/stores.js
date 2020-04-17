import { writable, readable, derived } from 'svelte/store';
import * as d3 from 'd3';

let parseTime = d3.timeParse('%Y%m%d');
let formatTime = d3.timeFormat('%Y-%m-%d');

// Manually curated list of sensors with metadata.
// Selected so that we know we are able to display them.
// Check https://delphi.cmu.edu/epidata/api.php?source=covid_alert_meta
// For updated sensors/API and update this accordingly.
export const sensors = readable([
  {
    name: 'Facebook Surveys',
    id: 'fb_survey',
    signal: 'cli',
    levels: ['county', 'msa'],
  },
  {
    name: 'Google Surveys',
    id: 'google-survey',
    signal: 'cli',
    levels: ['county'],
  },
  {
    name: 'Quidel Flu Tests',
    id: 'quidel',
    signal: 'negativeratio',
    levels: ['county', 'msa'],
  },
  {
    name: 'Google Health Trends',
    id: 'ght',
    signal: 'smoothedsearch',
    levels: ['msa'],
  },
  // "Optum Hospitalizations",
  // "Quidel Flu Tests",
  // "Crowdcast",
  // "Kinsa Temperatures",
]);

export const times = writable(null);

export const levels = readable({
  county: 'County',
  state: 'State',
  msa: 'Metropolitan Statistical Area',
  // hrr: "Hospital Reporting Region",
});

// This loads all the GeoJSON's for each granularity that the MapBox component reads as layers.
export const geojsons = readable(new Map(), function start(set) {
  Promise.all([
    d3.json('./maps/albers_usa_gz_2010_us_050_00_5m.json'),
    d3.json('./maps/albers_usa_gz_2010_us_040_00_5m.json'),
    d3.json('./maps/albers_usa_tl_2019_us_metdiv.json'),
    // d3.json("./maps/albers_usa_hospital_referral_region_v2.json"),
  ]).then(([a, b, c, d]) => {
    let m = new Map();
    m.set('county', a);
    m.set('state', b);
    m.set('msa', c);
    // m.set("hrr", d);
    set(m);
  });
});

// TODO: document this structure.
//It's an array of objects for each sensor.
// Each sensor object has an array for a granularity for all the entries.
export const data = writable();
export const dates = writable();
export const currentSensor = writable('google-survey');
export const currentLevel = writable('county');
// EpiWeek in form YYYYWW
export const currentWeek = writable(202014);
// EpiWeek in form YYYYMMDD
export const currentDate = writable(20200412);

// Data points for the current sensor, level, and day.
export const currentData = derived(
  [data, sensors, currentSensor, currentLevel, currentDate],
  ([$data, $sensors, $sensor, $level, $date]) => {
    let dt = formatTime(parseTime($date));
    if ($data) {
      let currDat = $data[$sensor][$level];
      let level = currDat ? $level : $sensors.find((d) => d.id === $sensor).levels[0];
      return $data[$sensor][level].filter((d) => d.date === dt);
    } else return [];
  },
);
// Data points for the current sensor, level, and geographic region.
// export const regionData = derived();

export const selectedRegion = writable('');
