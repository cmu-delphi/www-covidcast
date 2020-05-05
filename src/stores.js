import { writable, readable, derived } from 'svelte/store';
import { injectIDs } from './util.js';
import * as d3 from 'd3';
import moment from 'moment';

const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);

// Set of options for which signals to display.
// Checks the ?sensors= URI parameter for a custom view,
// otherwise uses the default.
export const sensors = readable(
  [
    {
      name: 'Doctor Visits',
      id: 'doctor-visits',
      tooltipText: 'Percentage of doctor visits that are due to COVID-like Symptoms',
      mapTitleText: 'Percentage of doctor visits that are due to COVID-like Symptoms',
      chartTitleText: 'Percentage of doctor visits with COVID-like Symptoms',
      yAxis: 'Percentage',
      format: 'percent',
      signal: 'smoothed_cli',
      levels: ['county', 'msa', 'state'],
    },
    {
      name: 'Surveys (Facebook)',
      id: 'fb-survey',
      tooltipText: 'CMU symptom surveys run through  Facebook - Thank you Facebook!',
      mapTitleText: 'Percentage of Facebook survey respondents reporting COVID-like symptoms',
      chartTitleText: 'Percentage of Facebook survey respondents reporting COVID-like symptoms',
      yAxis: 'Percentage',
      format: 'percent',
      signal: 'smoothed_cli',
      levels: ['county', 'msa', 'state'],
    },
    {
      name: 'Surveys (Google)',
      id: 'google-survey',
      tooltipText: 'Symptom surveys run by Google - Thank you Google!',
      mapTitleText: 'Percentage of Google survey respondents reporting COVID-like symptoms in their community',
      chartTitleText: 'Percentage of Google survey respondents reporting COVID-like symptoms in their community',
      yAxis: 'Percentage',
      format: 'percent',
      signal: 'smoothed_cli',
      levels: ['county', 'state', 'msa'],
    },
    {
      name: 'Search Trends (Google)',
      id: 'ght',
      tooltipText: 'Covid-related search frequency from Google’s Health Trends team - Thank you Google!',
      mapTitleText: 'Relative frequency of COVID-related Google searches',
      chartTitleText: 'Relative frequency of COVID-related Google searches',
      yAxis: 'Relative frequency',
      format: 'raw',
      signal: 'smoothed_search',
      levels: ['msa', 'state'],
    },
    {
      name: 'Flu Testing (Quidel)',
      id: 'quidel',
      tooltipText: 'Relative demand for Influenza tests, from Quidel, Inc. - Thank you Quidel!',
      mapTitleText: 'Relative demand for Influenza tests',
      chartTitleText: 'Relative demand for Influenza tests',
      yAxis: 'Relative demand',
      format: 'raw',
      signal: 'smoothed_tests_per_device',
      levels: ['msa', 'state'],
    },
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
    d3.json('./maps/counties-simple.json'),
    d3.json('./maps/states-simple.json'),
    d3.json('./maps/msa-albers-simple.json'),
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

export const currentSensor = writable('doctor-visits-smoothed_cli', (set) => {
  let sensor = urlParams.get('sensor');
  sensor ? set(sensor) : '';
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
export const currentDate = writable(20200420, (set) => {
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

export const timeRangeOnSlider = writable({ min: 0, max: 0 });
export const yesterday = +moment(new Date(new Date().getTime() - 86400 * 1000)).format('YYYYMMDD');
