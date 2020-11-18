import { writable, derived, get, readable } from 'svelte/store';
import { LogScale, SqrtScale } from './scales';
import { scaleSequentialLog } from 'd3-scale';
import { defaultSensorId, sensorList, sensorMap, yesterdayDate, levels, swpaLevels } from './constants';
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
import { MAP_THEME, selectionColors } from '../theme';

/**
 * @typedef {import('../data/fetchData').EpiDataRow} EpiDataRow
 */

const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);

export const times = writable(null);
export const stats = writable(null);

export const appReady = writable(false);

/**
 * @type {import('svelte/store').Writable<import('../routes').Mode>}
 */
export const currentMode = writable(modeByID.overview, (set) => {
  const mode = urlParams.get('mode');
  const nextMode = modes.find((d) => d.id === mode);
  if (nextMode) {
    set(nextMode);
  }
});

export const currentSensor = writable('', (set) => {
  const sensor = urlParams.get('sensor');
  if (sensor && sensorMap.has(sensor)) {
    set(sensor);
  } else {
    const defaultSensor = sensorList.find((d) => d.id === defaultSensorId);
    if (defaultSensor) {
      set(defaultSensor.key);
    } else {
      set(sensorList[0].key);
    }
  }
});

/**
 * @type {import('svelte/store').Writable<import('../data').SensorEntry | null>}
 */
export const currentInfoSensor = writable(null);

export const currentSensorEntry = derived([currentSensor], ([$currentSensor]) => sensorMap.get($currentSensor));

// 'county', 'state', or 'msa'
export const currentLevel = writable('county', (set) => {
  const level = urlParams.get('level');
  if (levels.includes(level) || swpaLevels.includes(level)) {
    set(level);
  }
});

// Options are 'direction' and 'value'.
/**
 * @type {import('svelte/store').Writable<'direction' | 'value'>}
 */
export const signalType = writable('value');
// , (set) => {
//   const signalT = urlParams.get('signalType');
//   if (signalT === 'direction' || signalT === 'value') {
//     // set(signalT);
//     set('value');
//   }
// });

export const isValueSignalType = derived([signalType], ([v]) => v === 'value');
export const isDirectionSignalType = derived([signalType], ([v]) => v === 'direction');

// in case of a death signal whether to show cumulative data
export const signalCasesOrDeathOptions = writable({
  cumulative: urlParams.has('signalC'),
  ratio: urlParams.has('signalR'),
});

export const currentSensorMapTitle = derived([currentSensorEntry, signalCasesOrDeathOptions], ([sensor, options]) =>
  typeof sensor.mapTitleText === 'function' ? sensor.mapTitleText(options) : sensor.mapTitleText,
);

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

export const detailViewTimeSpan = writable([]);

// Region GEO_ID for filtering the line chart
// 42003 - Allegheny; 38300 - Pittsburgh; PA - Pennsylvania.
export const currentRegion = writable('', (set) => {
  const region = urlParams.get('region');
  // TODO validation
  if (region) {
    set(region);
  }
});

/**
 * current region info (could also be null)
 */
export const currentRegionInfo = derived([currentRegion], ([current]) => getInfoByName(current));

/**
 * @type {import('svelte/store').Writable<import('../maps').NameInfo[]>}
 */
export const recentRegionInfos = writable([]);

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
  infos.push(v);
  recentRegionInfos.set(infos);
});

/**
 *
 * @param {import('../maps/nameIdInfo').NameInfo | null} elem
 */
export function selectByInfo(elem, reset = false) {
  if (elem === get(currentRegionInfo)) {
    if (reset) {
      currentRegion.set('');
    }
    return;
  }
  if (elem) {
    currentRegion.set(elem.propertyId);
    // the info is derived
  } else {
    currentRegion.set('');
  }
}

export function selectByFeature(feature, reset = false) {
  selectByInfo(feature ? getInfoByName(feature.properties.id) : null, reset);
}

export const colorScale = writable(scaleSequentialLog());
export const colorStops = writable([]);
export const bubbleRadiusScale = writable(LogScale());
export const spikeHeightScale = writable(SqrtScale());

// validate if sensor and other parameter matches
currentSensorEntry.subscribe((sensorEntry) => {
  // check level
  const level = get(currentLevel);

  if (!sensorEntry.levels.includes(level)) {
    currentLevel.set(sensorEntry.levels[0]);
  }

  if (get(currentInfoSensor)) {
    // show help, update it
    currentInfoSensor.set(sensorEntry);
  }

  // if (sensorEntry.type === 'late' && sensorEntry.id !== 'hospital-admissions') {
  //   signalType.set('value');
  // }

  if (!sensorEntry.isCasesOrDeath) {
    signalCasesOrDeathOptions.set({
      cumulative: false,
      ratio: false,
    });
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

// mobile device detection
// const isDesktop = window.matchMedia('only screen and (min-width: 768px)');

export const isMobileDevice = readable(false, (set) => {
  const isMobileQuery = window.matchMedia('only screen and (max-width: 767px)');
  set(isMobileQuery.matches);
  isMobileQuery.addEventListener('change', (evt) => {
    set(evt.matches);
  });
});

// export const isPortraitDevice = readable(false, (set) => {
//   const isPortraitQuery = window.matchMedia('only screen and (orientation: portrait)');
//   set(isPortraitQuery.matches);
//   isPortraitQuery.addListener((r) => {
//     set(r.matches);
//   });
// });

// overview compare mode

/**
 * @typedef {object} CompareSelection
 * @property {import('../maps').NameInfo} info
 * @property {string} color
 * @property {string} displayName;
 */

// null = disable
// []
/**
 * @type {import('svelte/store').Writable<CompareSelection[] | null>}
 * */
export const currentCompareSelection = writable(null, (set) => {
  const ids = (urlParams.get('compare') || '').split(',').map(getInfoByName).filter(Boolean);
  if (ids.length > 0) {
    set(ids.map((info, i) => ({ info, displayName: info.displayName, color: selectionColors[i] || 'grey' })));
  }
});

/**
 * add an element to the compare selection
 * @param {import('../maps').NameInfo} info
 */
export function addCompare(info) {
  if (!get(currentRegionInfo)) {
    selectByInfo(info);
    return;
  }

  const current = get(currentCompareSelection) || [];
  currentCompareSelection.set([
    ...current,
    {
      info,
      displayName: info.displayName,
      color: selectionColors[current.length] || 'grey',
    },
  ]);
}

/**
 * removes an element from the compare selection
 * @param {import('../maps').NameInfo} info
 */
export function removeCompare(info) {
  const selection = get(currentRegionInfo);
  const bak = (get(currentCompareSelection) || []).slice();
  if (selection && info.id === selection.id) {
    selectByInfo(bak.length === 0 ? null : bak[0].info);
    currentCompareSelection.set(bak.slice(1).map((old, i) => ({ ...old, color: selectionColors[i] || 'grey' })));
    return;
  }
  currentCompareSelection.set(
    bak.filter((d) => d.info !== info).map((old, i) => ({ ...old, color: selectionColors[i] || 'grey' })),
  );
}

/**
 * @type {import('svelte/store').Readable<CompareSelection[]>}
 */
export const currentMultiSelection = derived(
  [currentRegionInfo, currentCompareSelection],
  ([selection, compareSelection]) =>
    [
      selection && { info: selection, color: MAP_THEME.selectedRegionOutline, displayName: selection.displayName },
      compareSelection || [],
    ]
      .filter(Boolean)
      .flat(),
);
