import { writable, derived, get, readable } from 'svelte/store';
import { LogScale, SqrtScale } from './scales';
import { scaleSequentialLog } from 'd3-scale';
import {
  sensorMap,
  yesterdayDate,
  levels,
  DEFAULT_LEVEL,
  DEFAULT_MODE,
  DEFAULT_SENSOR,
  DEFAULT_SURVEY_SENSOR,
  DEFAULT_ENCODING,
  defaultRegionOnStartup,
  sensorList,
  CasesOrDeathOptions,
  SensorEntry,
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
import { MAP_THEME, selectionColors } from '../theme';
import { AnnotationManager, fetchAnnotations } from '../data';
import type { NameInfo, RegionLevel } from '../maps/interfaces';

/**
 * @typedef {import('../data/fetchData').EpiDataRow} EpiDataRow
 */
export const times = writable<Map<string, [number, number]>>(null);
export const stats = writable<Map<string, { max: number; mean: number; std: number }>>(null);

export const appReady = writable(false);

/**
 * magic date that will be replaced by the latest date
 */
export const MAGIC_START_DATE = '20200701';

function deriveFromPath(url: Location) {
  const queryString = url.search;
  const urlParams = new URLSearchParams(queryString);

  const sensor = urlParams.get('sensor');
  const sensor2 = urlParams.get('sensor2');
  const level = (urlParams.get('level') as unknown) as RegionLevel;
  const encoding = urlParams.get('encoding');
  const date = urlParams.get('date');

  const compareIds = (urlParams.get('compare') || '')
    .split(',')
    .map((d) => getInfoByName(d) as NameInfo)
    .filter(Boolean);

  const modeFromPath = () => {
    const pathName = url.pathname;
    // last path segment, e.g. /test/a -> a, /test/b/ -> b
    return pathName.split('/').filter(Boolean).reverse()[0];
  };
  const mode = urlParams.get('mode') || modeFromPath();

  const modeObj = modes.find((d) => d.id === mode) || DEFAULT_MODE;
  const resolveSensor =
    sensor && sensorMap.has(sensor)
      ? sensor
      : modeObj === modeByID['survey-results']
      ? DEFAULT_SURVEY_SENSOR
      : DEFAULT_SENSOR;
  return {
    mode: modeObj,
    sensor: resolveSensor,
    sensor2: sensor2 && sensorMap.has(sensor2) ? sensor2 : sensorList.filter((d) => d.key !== resolveSensor)[0].key,
    level: levels.includes(level) ? level : DEFAULT_LEVEL,
    signalCasesOrDeathOptions: {
      cumulative: urlParams.has('signalC'),
      incidence: urlParams.has('signalI'),
    } as CasesOrDeathOptions,
    encoding: encoding === 'color' || encoding === 'bubble' || encoding === 'spike' ? encoding : DEFAULT_ENCODING,
    date: /\d{8}/.test(date) ? date : MAGIC_START_DATE,
    region: urlParams.get('region') || '',
    compare:
      compareIds.length > 0
        ? compareIds.map(
            (info, i) =>
              ({ info, displayName: info.displayName, color: selectionColors[i] || 'grey' } as CompareSelection),
          )
        : null,
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

export const currentSensor2 = writable(defaultValues.sensor2);
export const currentSensorEntry2 = derived([currentSensor2], ([$currentSensor]) => sensorMap.get($currentSensor));

export const currentInfoSensor = writable<SensorEntry | null>(null);

export const currentLevel = writable(defaultValues.level);

// in case of a death signal whether to show cumulative data
export const signalCasesOrDeathOptions = writable(defaultValues.signalCasesOrDeathOptions);

export const currentSensorMapTitle = derived([currentSensorEntry, signalCasesOrDeathOptions], ([sensor, options]) =>
  typeof sensor.mapTitleText === 'function' ? sensor.mapTitleText(options) : sensor.mapTitleText,
);

export const encoding = writable(defaultValues.encoding);

export const currentDate = writable(defaultValues.date);
/**
 * current date as a Date object
 */
export const currentDateObject = derived([currentDate], ([date]) => (!date ? null : parseAPITime(date)));

export const smallMultipleTimeSpan = derived([currentDateObject], ([date]): [Date, Date] => {
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

/**
 * For mouseover highlighting across small multiple charts.
 */
export const highlightTimeValue = writable<null | number>(null);

// Region GEO_ID for filtering the line chart
// 42003 - Allegheny; 38300 - Pittsburgh; PA - Pennsylvania.
export const currentRegion = writable(defaultValues.region);

/**
 * current region info (could also be null)
 */
export const currentRegionInfo = derived([currentRegion], ([current]) => getInfoByName(current) as NameInfo | null);

function deriveRecent(): NameInfo[] {
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
 * @returns {boolean} whether the selection has changed
 */
export function selectByInfo(elem: NameInfo | null, reset = false): boolean {
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

export function selectByFeature(feature: { properties: { id: string } }, reset = false): boolean {
  return selectByInfo(feature ? getInfoByName(feature.properties.id) : null, reset);
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

  if (!sensorEntry.isCasesOrDeath) {
    signalCasesOrDeathOptions.set({
      cumulative: false,
      incidence: false,
    });
  }

  // clamp to time span
  const timesMap = get(times);
  if (timesMap != null) {
    const [minDate, maxDate] = timesMap.get(sensorEntry.key);
    const current = get(currentDate);
    if (current < String(minDate)) {
      currentDate.set(String(minDate));
    } else if (current > String(maxDate)) {
      currentDate.set(String(maxDate));
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
      currentDate.set(String(entry[1])); // max
    }
  }
});

// mobile device detection
// const isDesktop = window.matchMedia('only screen and (min-width: 768px)');

const isMobileQuery = window.matchMedia
  ? window.matchMedia('only screen and (max-width: 767px)')
  : (({ matches: false, addEventListener: () => undefined } as unknown) as MediaQueryList);
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

// export const isPortraitDevice = readable(false, (set) => {
//   const isPortraitQuery = window.matchMedia('only screen and (orientation: portrait)');
//   set(isPortraitQuery.matches);
//   isPortraitQuery.addListener((r) => {
//     set(r.matches);
//   });
// });

// overview compare mode

export interface CompareSelection {
  info: NameInfo;
  color: string;
  displayName: string;
}

export const currentCompareSelection = writable(defaultValues.compare);

/**
 * add an element to the compare selection
 */
export function addCompare(info: NameInfo): void {
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
export function removeCompare(info: NameInfo): void {
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

export const currentMultiSelection = derived(
  [currentRegionInfo, currentCompareSelection],
  ([selection, compareSelection]): CompareSelection[] => {
    const base = [...(compareSelection || [])];
    if (selection) {
      base.unshift({ info: selection, color: MAP_THEME.selectedRegionOutline, displayName: selection.displayName });
    }
    return base;
  },
);

export interface PersistedState {
  mode?: string;
  sensor?: string;
  sensor2?: string;
  level?: RegionLevel;
  region?: string;
  date?: string;
  signalC?: boolean;
  signalI?: boolean;
  encoding?: 'color' | 'bubble' | 'spike';
  compare?: string;
}
export interface TrackedState {
  state: PersistedState;
  path: string;
  params: Omit<PersistedState, 'mode'>;
}

export const trackedUrlParams = derived(
  [
    currentMode,
    currentSensor,
    currentSensor2,
    currentLevel,
    currentRegion,
    currentDate,
    signalCasesOrDeathOptions,
    encoding,
    currentCompareSelection,
  ],
  ([mode, sensor, sensor2, level, region, date, signalOptions, encoding, compare]): TrackedState => {
    const sensorEntry = sensorMap.get(sensor);
    const inMapMode = mode === modeByID.summary || mode === modeByID.timelapse;

    // determine parameters based on default value and current mode
    const params: Omit<PersistedState, 'mode'> = {
      sensor:
        mode === modeByID.landing ||
        mode === modeByID.summary ||
        mode === modeByID.single ||
        mode === modeByID['survey-results'] ||
        sensor === DEFAULT_SENSOR
          ? null
          : sensor,
      sensor2: mode === modeByID.correlation ? sensor2 : null,
      level:
        mode === modeByID.single ||
        mode === modeByID.export ||
        mode === modeByID['survey-results'] ||
        level === DEFAULT_LEVEL
          ? null
          : level,
      region: mode === modeByID.export || mode === modeByID.timelapse ? null : region,
      date: mode === modeByID.export || mode === modeByID.landing ? null : String(date),
      signalC: !inMapMode || !sensorEntry || !sensorEntry.isCasesOrDeath ? null : signalOptions.cumulative,
      signalI: !inMapMode || !sensorEntry || !sensorEntry.isCasesOrDeath ? null : signalOptions.incidence,
      encoding: !inMapMode || encoding === DEFAULT_ENCODING ? null : encoding,
      compare:
        (mode !== modeByID.classic && mode !== modeByID.single) || !compare
          ? null
          : compare.map((d) => d.info.propertyId).join(','),
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

export function getScrollToAnchor(mode: { anchor?: string }): string | null {
  const anchor = mode.anchor;
  delete mode.anchor;
  return anchor;
}
export function switchToMode(mode: { anchor?: string }, anchor: string): void {
  mode.anchor = anchor;
  currentMode.set(mode);
}

export function loadFromUrlState(state: PersistedState): void {
  if (state.mode !== get(currentMode).id) {
    currentMode.set(modeByID[state.mode]);
  }
  if (state.sensor != null && state.sensor !== get(currentSensor)) {
    currentSensor.set(state.sensor);
  }
  if (state.sensor2 != null && state.sensor2 !== get(currentSensor2)) {
    currentSensor2.set(state.sensor2);
  }
  if (state.level != null && state.level !== get(currentLevel)) {
    currentLevel.set(state.level);
  }
  if (state.region != null && state.region !== get(currentRegion)) {
    currentRegion.set(state.region);
  }
  if (state.date != null && state.date !== get(currentDate)) {
    currentDate.set(state.date);
  }
  if (state.encoding != null && state.encoding !== get(encoding)) {
    encoding.set(state.encoding);
  }
  if (state.signalC || state.signalI) {
    signalCasesOrDeathOptions.set({
      cumulative: state.signalC != null,
      incidence: state.signalI != null,
    });
  }
  if (state.compare) {
    const compareIds = state.compare
      .split(',')
      .map((d) => getInfoByName(d) as NameInfo)
      .filter(Boolean);
    currentCompareSelection.set(
      compareIds.map((info, i) => ({ info, displayName: info.displayName, color: selectionColors[i] || 'grey' })),
    );
  }
}

export const annotationManager = writable(new AnnotationManager());

export function loadAnnotations(): void {
  void fetchAnnotations().then((annotations) => {
    annotationManager.set(new AnnotationManager(annotations));
  });
}