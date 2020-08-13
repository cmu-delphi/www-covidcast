import { writable, readable, derived, get } from 'svelte/store';
import { LogScale, SqrtScale } from './scales';
import { scaleSequentialLog } from 'd3-scale';
import { sensorList, withSensorEntryKey, defaultSensorId } from './constants';
import modes from '../modes';
import { parseAPITime } from '../data/utils';
import { regionSearchLookup } from './search';
export { defaultRegionOnStartup, getLevelInfo, levels, levelList, yesterday, yesterdayDate } from './constants';
export { regionSearchList } from './search';

/**
 * @typedef {import('../data/fetchData').EpiDataRow} EpiDataRow
 */

const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);

// Set of options for which signals to display.
// Checks the ?sensors= URI parameter for a custom view,
// otherwise uses the default.
export const sensors = readable(sensorList, (set) => {
  const sensorsOption = urlParams.get('sensors');
  if (sensorsOption) {
    set(JSON.parse(decodeURIComponent(sensorsOption)).map(withSensorEntryKey));
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

export const times = writable(null);
export const stats = writable(null);

export const mounted = writable(0);
export const mapFirstLoaded = writable(false);
export const currentDataReadyOnMap = writable(false);
export const customDataView = readable(true, (set) => {
  set(urlParams.get('sensors') != null);
});

/**
 * @type {import('svelte/store').Writable<import('../routes').Mode>}
 */
export const currentMode = writable(modes[0], (set) => {
  const mode = urlParams.get('mode');
  if (modes.find((d) => d.id === mode)) {
    set(modes.find((d) => d.id === mode));
  }
});

export const currentSensor = writable('', (set) => {
  const sensor = urlParams.get('sensor');
  if (sensor && get(sensorMap).has(sensor)) {
    set(sensor);
  } else {
    const activeSensors = get(sensors);
    const defaultSensor = activeSensors.find((d) => d.id === defaultSensorId);
    if (defaultSensor) {
      set(defaultSensor.key);
    } else {
      set(activeSensors[0].key);
    }
  }
});
export const currentSensorEntry = derived([sensorMap, currentSensor], ([$sensorMap, $currentSensor]) =>
  $sensorMap.get($currentSensor),
);

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
    // set(signalT);
    set('value');
  }
});

// Options are 'color', 'bubble', and 'spike'
export const encoding = writable('color', (set) => {
  const encoding = urlParams.get('encoding');
  if (encoding === 'color' || encoding === 'bubble' || encoding === 'spike') {
    set(encoding);
  }
});

/**
 * magic date that will be replaced by the latest date
 */
export const MAGIC_START_DATE = '20200701';
export const currentDate = writable(MAGIC_START_DATE, (set) => {
  const date = urlParams.get('date');
  if (/\d{8}/.test(date)) {
    set(date);
  }
});

/**
 * current date as a Date object
 */
export const currentDateObject = derived([currentDate], ([date]) => (!date ? null : parseAPITime(date)));

// Region GEO_ID for filtering the line chart
// 42003 - Allegheny; 38300 - Pittsburgh; PA - Pennsylvania.
export const currentRegion = writable('', (set) => {
  const region = urlParams.get('region');
  // TODO validation
  if (region) {
    set(region);
  }
});
export const currentRegionName = writable('');

/**
 * current region info (could also be null)
 */
export const currentRegionInfo = derived([currentRegion, regionSearchLookup], ([current, lookup]) => lookup(current));

/**
 *
 * @param {import('../maps/nameIdInfo').NameInfo | null} elem
 */
export function selectByInfo(elem) {
  if (elem === get(currentRegionInfo)) {
    return;
  }
  if (elem) {
    currentRegion.set(elem.propertyId);
    currentRegionName.set(elem.displayName);
    // the info is derived
  } else {
    currentRegion.set('');
    currentRegionName.set('');
  }
}

export function selectByFeature(feature) {
  const lookup = get(regionSearchLookup);
  selectByInfo(feature ? lookup(feature.properties.id) : null);
}

/**
 * @type {import('svelte/store').Writable<EpiDataRow[]>}
 */
export const regionData = writable([]);
/**
 * @type {import('svelte/store').Writable<EpiDataRow[]>}
 */
export const currentData = writable([]);

export const timeRangeOnSlider = writable({
  min: 0,
  max: 0,
});

// Range of time for the map slider.
export const currentRange = writable([0, 1]);
export const colorScale = writable(scaleSequentialLog());
export const colorStops = writable([]);
export const bubbleRadiusScale = writable(LogScale());
export const spikeHeightScale = writable(SqrtScale());
