import { writable, readable, derived, get } from 'svelte/store';
import { injectIDs } from '../util';
import { LogScale, SqrtScale } from '../components/scale.js';
import * as d3 from 'd3';
import { sensorList, withSensorEntryKey } from './constants';
export {
  dict,
  specialCounties,
  defaultRegionOnStartup,
  getLevelInfo,
  levels,
  levelList,
  yesterday,
  yesterdayDate,
} from './constants';

const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);

// Set of options for which signals to display.
// Checks the ?sensors= URI parameter for a custom view,
// otherwise uses the default.
export const sensors = readable(sensorList, (set) => {
  const sensorsOption = urlParams.get('sensors');
  if (sensorsOption) {
    set(withSensorEntryKey(JSON.parse(decodeURIComponent(sensorsOption))));
  }
});

export const publicSensors = derived([sensors], ([sensors]) => sensors.filter((d) => d.type == 'public'));
export const earlySensors = derived([sensors], ([sensors]) => sensors.filter((d) => d.type == 'early'));
export const lateSensors = derived([sensors], ([sensors]) => sensors.filter((d) => d.type == 'late'));

// The ID to reference each sensor is the indicator name + signal type.
// This map is used to find the information for each sensor.
export const sensorMap = derived(sensors, ($sensors) => {
  /**
   * @type {Map<string, import('./constants').SensorEntry>}
   */
  const map = new Map();
  $sensors.forEach((d) => map.set(d.key, d));
  return map;
});

// This loads all the GeoJSON's for each granularity that the MapBox component reads as layers.
export const geojsons = readable(new Map(), (set) => {
  Promise.all([
    d3.json('./maps/new_counties.json'),
    d3.json('./maps/new_states.json'),
    d3.json('./maps/new_msa.json'),
    d3.json('./maps/city_data/cities-reprojected.json'),
    d3.json('./maps/state_centers.json'),
    d3.json('./maps/county_centers.json'),
    d3.json('./maps/msa_centers.json'),
    d3.json('./maps/new_zones.json'),
  ]).then(([counties, states, msa, cities, stateCenters, countyCenters, msaCenters, newZones]) => {
    const m = new Map();
    m.set('county', injectIDs('county', counties));
    m.set('state', injectIDs('state', states));
    m.set('msa', injectIDs('msa', msa));
    m.set('city', cities);
    m.set('state-centers', injectIDs('state-centers', stateCenters));
    m.set('county-centers', injectIDs('county-centers', countyCenters));
    m.set('msa-centers', injectIDs('msa-centers', msaCenters));
    m.set('zone', newZones);
    set(m);
  });
});

export const times = writable(null);
export const stats = writable(null);

export const mounted = writable(0);
export const mapFirstLoaded = writable(false);
export const currentDataReadyOnMap = writable(false);
export const customDataView = readable(true, (set) => {
  set(urlParams.get('sensors') != null);
});

export const currentSensor = writable('', (set) => {
  const sensor = urlParams.get('sensor');
  if (sensor && get(sensorMap).has(sensor)) {
    set(sensor);
  } else {
    const firstKey = Array.from(get(sensorMap).keys())[0];
    set(firstKey);
  }
});

// 'county', 'state', or 'msa'
export const currentLevel = writable('county', (set) => {
  const level = urlParams.get('level');
  if (['county', 'state', 'msa'].includes(level)) {
    set(level);
  }
});

// Options are 'direction' and 'value'.
export const signalType = writable('value', (set) => {
  const signalT = urlParams.get('signalType');
  if (signalT === 'direction' || signalT === 'value') {
    set(signalT);
    //set('value');
  }
});

// Options are 'color', 'bubble', and 'spike'
export const encoding = writable('color', (set) => {
  const encoding = urlParams.get('encoding');
  if (encoding === 'color' || encoding === 'bubble' || encoding === 'spike') {
    set(encoding);
  }
});

// EpiWeek in form YYYYMMDD.
export const currentDate = writable(20100420, (set) => {
  const date = urlParams.get('date');
  if (/\d{8}/.test(date)) {
    set(date);
  }
});

// Region GEO_ID for filtering the line chart
// 42003 - Allegheny; 38300 - Pittsburgh; PA - Pennsylvania.
export const currentRegion = writable('', (set) => {
  const region = urlParams.get('region');
  // TODO validation
  if (region) {
    set(region);
  }
});

// currently only supporting 'swpa' - South western Pennsylvania
export const currentZone = writable('', (set) => {
  const zone = urlParams.get('zone');
  if (zone === 'swpa') {
    set(zone);
  }
});

// Range of time for the map slider.
export const currentRange = writable([0, 1]);

export const currentRegionName = writable('');

export const currentSensorEntry = derived([sensorMap, currentSensor], ([$sensorMap, $currentSensor]) =>
  $sensorMap.get($currentSensor),
);

export const regionData = writable([]);
export const currentData = writable([]);

export const timeRangeOnSlider = writable({
  min: 0,
  max: 0,
});

export const colorScale = writable(d3.scaleSequentialLog());
export const colorStops = writable([]);
export const bubbleRadiusScale = writable(LogScale());
export const spikeHeightScale = writable(SqrtScale());
