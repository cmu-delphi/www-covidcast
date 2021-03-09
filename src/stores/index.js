import { writable, derived, get, readable } from 'svelte/store';
import {
  sensorMap,
  yesterdayDate,
  DEFAULT_MODE,
  DEFAULT_SENSOR,
  DEFAULT_SURVEY_SENSOR,
  defaultRegionOnStartup,
} from './constants';
import modes, { modeByID } from '../modes';
import { parseAPITime } from '../data/utils';
import { getInfoByName } from '../maps';
export {
  defaultRegionOnStartup,
  getLevelInfo,
  levels,
  levelList,
  yesterday,
  yesterdayDate,
  sensorList,
  sensorMap,
  groupedSensorList,
} from './constants';
import { timeMonth } from 'd3-time';

/**
 * @typedef {import('../data/fetchData').EpiDataRow} EpiDataRow
 */
export const times = writable(null);
export const stats = writable(null);

export const appReady = writable(false);

/**
 * magic date that will be replaced by the latest date
 */
export const MAGIC_START_DATE = '20200701';

function deriveFromPath(url) {
  const queryString = url.search;
  const urlParams = new URLSearchParams(queryString);

  const sensor = urlParams.get('sensor');
  const date = urlParams.get('date');

  const modeFromPath = () => {
    const pathName = url.pathname;
    // last path segment, e.g. /test/a -> a, /test/b/ -> b
    return pathName.split('/').filter(Boolean).reverse(0)[0];
  };
  const mode = urlParams.get('mode') || modeFromPath();

  const modeObj = modes.find((d) => d.id === mode) || DEFAULT_MODE;
  return {
    mode: modeObj,
    sensor:
      sensor && sensorMap.has(sensor)
        ? sensor
        : modeObj === modeByID['survey-results']
        ? DEFAULT_SURVEY_SENSOR
        : DEFAULT_SENSOR,
    date: /\d{8}/.test(date) ? date : MAGIC_START_DATE,
    region: urlParams.get('region') || '',
  };
}
/**
 * resolve the default values based on the
 */
const defaultValues = deriveFromPath(window.location);

/**
 * @type {import('svelte/store').Writable<import('../modes').Mode>}
 */
export const currentMode = writable(defaultValues.mode);

export const currentSensor = writable(defaultValues.sensor);
export const currentSensorEntry = derived([currentSensor], ([$currentSensor]) => sensorMap.get($currentSensor));

/**
 * @type {import('svelte/store').Writable<import('../data').SensorEntry | null>}
 */
export const currentInfoSensor = writable(null);

export const currentDate = writable(defaultValues.date);
/**
 * current date as a Date object
 */
export const currentDateObject = derived([currentDate], ([date]) => (!date ? null : parseAPITime(date)));

export const smallMultipleTimeSpan = derived([currentDateObject], ([date]) => {
  if (!date) {
    return [timeMonth.offset(yesterdayDate, -4), yesterdayDate];
  }
  let max = timeMonth.offset(date, 2);
  if (max > yesterdayDate) {
    max = yesterdayDate;
  }
  const min = timeMonth.offset(max, -4);
  return [min, max];
});

// Region GEO_ID for filtering the line chart
// 42003 - Allegheny; 38300 - Pittsburgh; PA - Pennsylvania.
export const currentRegion = writable(defaultValues.region);

/**
 * current region info (could also be null)
 */
export const currentRegionInfo = derived([currentRegion], ([current]) => getInfoByName(current));

function deriveRecent() {
  if (!window.localStorage) {
    return [];
  }
  const item = window.localStorage.getItem('recent') || '';
  if (!item) {
    return [getInfoByName(defaultRegionOnStartup.state), getInfoByName(defaultRegionOnStartup.county)];
  }
  return item
    .split(',')
    .filter(Boolean)
    .map((d) => getInfoByName(d));
}
/**
 * @type {import('svelte/store').Writable<import('../maps').NameInfo[]>}
 */
export const recentRegionInfos = writable(deriveRecent());

// keep track of top 10 recent selections
currentRegionInfo.subscribe((v) => {
  if (!v) {
    return;
  }
  const infos = get(recentRegionInfos).slice();
  const index = infos.indexOf(v);
  if (index >= 0) {
    infos.splice(index, 1);
  }
  if (infos.length > 10) {
    infos.shift();
  }
  infos.unshift(v);
  recentRegionInfos.set(infos);

  if (window.localStorage) {
    window.localStorage.setItem('recent', infos.map((d) => d.propertyId).join(','));
  }
});

/**
 *
 * @param {import('../maps/nameIdInfo').NameInfo | null} elem
 * @returns {boolean} whether the selection has changed
 */
export function selectByInfo(elem, reset = false) {
  if (elem === get(currentRegionInfo)) {
    if (reset) {
      currentRegion.set('');
    }
    return reset;
  }
  if (elem) {
    currentRegion.set(elem.propertyId);
    // the info is derived
  } else {
    currentRegion.set('');
  }
  return true;
}

// validate if sensor and other parameter matches
currentSensorEntry.subscribe((sensorEntry) => {
  if (get(currentInfoSensor)) {
    // show help, update it
    currentInfoSensor.set(sensorEntry);
  }
  // clamp to time span
  const timesMap = get(times);
  if (timesMap != null) {
    const [minDate, maxDate] = timesMap.get(sensorEntry.key);
    const current = get(currentDate);
    if (current < minDate) {
      currentDate.set(minDate);
    } else if (current > maxDate) {
      currentDate.set(maxDate);
    }
  }
});

currentMode.subscribe((mode) => {
  if (mode === modeByID['survey-results']) {
    // change sensor and date to the latest one within the survey
    currentSensor.set(DEFAULT_SURVEY_SENSOR);
    const timesMap = get(times);
    if (timesMap != null) {
      const entry = timesMap.get(DEFAULT_SURVEY_SENSOR);
      currentDate.set(entry[1]); // max
    }
  }
});

// mobile device detection
// const isDesktop = window.matchMedia('only screen and (min-width: 768px)');

const isMobileQuery = window.matchMedia
  ? window.matchMedia('only screen and (max-width: 767px)')
  : { matches: false, addEventListener: () => undefined };
export const isMobileDevice = readable(isMobileQuery.matches, (set) => {
  if (typeof isMobileQuery.addEventListener === 'function') {
    isMobileQuery.addEventListener('change', (evt) => {
      set(evt.matches);
    });
  } else {
    // deprecated but other version is not supported in Safari 13
    isMobileQuery.addListener((e) => {
      set(e.matches);
    });
  }
});

// overview compare mode

/**
 * @typedef {object} CompareSelection
 * @property {import('../maps').NameInfo} info
 * @property {string} color
 * @property {string} displayName;
 */

export const trackedUrlParams = derived(
  [currentMode, currentSensor, currentRegion, currentDate],
  ([mode, sensor, region, date]) => {
    // determine parameters based on default value and current mode
    const params = {
      sensor: mode === modeByID.landing || sensor === DEFAULT_SENSOR ? null : sensor,
      region: mode === modeByID.export ? null : region,
      date: mode === modeByID.export || mode === modeByID.landing ? null : date,
    };
    return {
      path: mode === DEFAULT_MODE ? `` : `${mode.id}/`,
      params,
      state: {
        mode: mode.id,
        ...params,
      },
    };
  },
);

export function loadFromUrlState(state) {
  if (state.mode !== get(currentMode).id) {
    currentMode.set(modeByID[state.mode]);
  }
  if (state.sensor != null && state.sensor !== get(currentSensor)) {
    currentSensor.set(state.sensor);
  }
  if (state.region != null && state.region !== get(currentRegion)) {
    currentRegion.set(state.region);
  }
  if (state.date != null && state.date !== get(currentDate)) {
    currentDate.set(state.date);
  }
}
