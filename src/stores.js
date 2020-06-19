import {
  writable,
  readable,
  derived,
  get
} from 'svelte/store';
import {
  injectIDs
} from './util.js';
import * as d3 from 'd3';
import moment from 'moment';

const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);

// Set of options for which signals to display.
// Checks the ?sensors= URI parameter for a custom view,
// otherwise uses the default.
export const sensors = readable(
  [{
      name: 'Doctor Visits',
      id: 'doctor-visits',
      tooltipText: 'Percentage of doctor visits that are due to COVID-like symptoms',
      mapTitleText: 'Percentage of doctor visits that are due to COVID-like symptoms',
      chartTitleText: 'Percentage of doctor visits that are due to COVID-like symptoms',
      yAxis: 'Percentage',
      format: 'percent',
      signal: 'smoothed_adj_cli',
      levels: ['county', 'msa', 'state'],
      official: false
    },
    {
      name: 'Symptoms (FB)',
      id: 'fb-survey',
      tooltipText: 'Percentage of people with COVID-like symptoms, based on Facebook surveys',
      mapTitleText: 'Percentage of people with COVID-like symptoms, based on Facebook surveys',
      chartTitleText: 'Percentage of people with COVID-like symptoms, based on Facebook surveys',
      yAxis: 'Percentage',
      format: 'percent',
      signal: 'smoothed_cli',
      levels: ['county', 'msa', 'state'],
      official: false,
    },
    {
      name: 'Symptoms in Community (FB)',
      id: 'fb-survey',
      tooltipText: 'Percentage of people who know someone in their local community with COVID-like symptoms, based on Facebook surveys',
      mapTitleText: 'Percentage of people who know someone in their local community with COVID-like symptoms, based on Facebook surveys',
      chartTitleText: 'Percentage of people who know someone in their local community with COVID-like symptoms, based on Facebook surveys',
      yAxis: 'Percentage',
      format: 'percent',
      signal: 'smoothed_hh_cmnty_cli',
      levels: ['county', 'msa', 'state'],
      official: false,
    },
    {
      name: 'Search Trends (Google)',
      id: 'ght',
      tooltipText: 'Relative frequency of COVID-related Google searches',
      mapTitleText: 'Relative frequency of COVID-related Google searches',
      chartTitleText: 'Relative frequency of COVID-related Google searches',
      yAxis: 'Frequency (arbitrary scale)',
      format: 'raw',
      signal: 'smoothed_search',
      levels: ['msa', 'state'],
      official: false,
    },
    {
      name: "Combined",
      id: "indicator-combination",
      tooltipText: 'Combination of COVID-19 indicators available at this geographic level',
      mapTitleText: 'Combination of COVID-19 indicators',
      chartTitleText: 'Combination of COVID-19 indicators',
      yAxis: 'Combined value (arbitrary scale)',
      format: "raw",
      signal: "nmf_day_doc_fbc_fbs_ght",
      levels: ["county", "msa", "state"],
      official: false,
    },
    {
      name: 'Cases',
      id: 'jhu-csse',
      tooltipText: 'Daily confirmed COVID-19 cases, as reported by Johns Hopkins University',
      mapTitleText: 'Daily confirmed COVID-19 cases',
      chartTitleText: 'Daily confirmed COVID-19 cases',
      yAxis: 'Cases',
      format: 'raw',
      signal: 'confirmed_7dav_incidence_num',
      levels: ['msa', 'county', 'state'],
      official: true,
    },
    {
      name: 'Cases per capita',
      id: 'jhu-csse',
      tooltipText: 'Daily confirmed COVID-19 cases per 100,000 people, based on data reported by Johns Hopkins University',
      mapTitleText: 'Daily confirmed COVID-19 cases per 100,000 people',
      chartTitleText: 'Daily confirmed COVID-19 cases per 100,000 people',
      yAxis: 'Cases per 100,000 people',
      format: 'raw',
      signal: 'confirmed_7dav_incidence_prop',
      levels: ['msa', 'county', 'state'],
      official: true,
      bolded: false
    },
    {
      name: 'Deaths',
      id: 'jhu-csse',
      tooltipText: 'Daily COVID-19 deaths, as reported by Johns Hopkins University',
      mapTitleText: 'Daily COVID-19 deaths',
      chartTitleText: 'Daily COVID-19 deaths',
      yAxis: 'Deaths',
      format: 'raw',
      signal: 'deaths_7dav_incidence_num',
      levels: ['msa', 'county', 'state'],
      official: true,
    },
    {
      name: 'Deaths per capita',
      id: 'jhu-csse',
      tooltipText: 'Daily COVID-19 deaths per 100,000 people, based on data reported by Johns Hopkins University',
      mapTitleText: 'Daily COVID-19 deaths per 100,000 people',
      chartTitleText: 'Daily COVID-19 deaths per 100,000 people',
      yAxis: 'Deaths per 100,000 people',
      format: 'raw',
      signal: 'deaths_7dav_incidence_prop',
      levels: ['msa', 'county', 'state'],
      official: true,
    }
  ],
  (set) => {
    let sensorsOption = urlParams.get('sensors');
    sensorsOption ? set(JSON.parse(decodeURIComponent(sensorsOption))) : '';
  },
);

// The ID to reference each sensor is the indicator name + signal type.
// This map is used to find the information for each sensor.
export const sensorMap = derived(sensors, ($sensors) => {
  let map = new Map();
  $sensors.forEach((d) => map.set(d.id + '-' + d.signal, d));
  return map;
});

export const levels = readable({
  state: 'State',
  msa: 'Metro Area',
  county: 'County',
});


// This loads all the GeoJSON's for each granularity that the MapBox component reads as layers.
export const geojsons = readable(new Map(), function start(set) {
  Promise.all([
    d3.json('./maps/new_counties.json'),
    d3.json('./maps/new_states.json'),
    d3.json('./maps/new_msa.json'),
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
export const stats = writable(null);

export const mounted = writable(0);
export const mapFirstLoaded = writable(false);
export const currentDataReadyOnMap = writable(false);
export const customDataView = readable(true, (set) => (urlParams.get('sensors') ? set(true) : set(false)));

export const currentSensor = writable('', (set) => {
  let sensor = urlParams.get('sensor');
  sensor ? set(sensor) : set(Array.from(get(sensorMap).keys())[0]);
  return () => '';
});
// 'county', 'state', or 'msa'
export const currentLevel = writable('county', (set) => {
  let level = urlParams.get('level');
  level ? set(level) : '';
  return () => '';
});
// Options are 'direction' and 'value'.
export const signalType = writable('value', (set) => {
  let signalT = urlParams.get('signalType');
  signalT ? set(signalT) : '';
  return () => '';
});
// EpiWeek in form YYYYMMDD.
export const currentDate = writable(20100420, (set) => {
  let date = urlParams.get('date');
  date ? set(date) : '';
  return () => '';
});
// Region GEO_ID for filtering the line chart
// 42003 - Allegheny; 38300 - Pittsburgh; PA - Pennsylvania.
export const currentRegion = writable('', (set) => {
  let region = urlParams.get('region');
  region ? set(region) : '';
  return () => '';
});
// Range of time for the map slider.
export const currentRange = writable([0, 1]);

export const currentRegionName = writable('');
export const currentSensorName = derived(
  [sensorMap, currentSensor],
  ([$sensorMap, $currentSensor]) => $sensorMap.get($currentSensor).name,
);
export const currentLevelName = derived([levels, currentLevel], ([$levels, $currentLevel]) => $levels[$currentLevel]);

export const regionSliceCache = writable(new Map());
export const timeSliceCache = writable(new Map());

export const regionData = writable([]);
export const currentData = writable([]);

export const timeRangeOnSlider = writable({
  min: 0,
  max: 0,
});
export const yesterday = +moment(new Date(new Date().getTime() - 86400 * 1000)).format('YYYYMMDD');