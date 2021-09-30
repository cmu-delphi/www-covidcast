import { writable, derived, get, readable } from 'svelte/store';
import {
  DEFAULT_MODE,
  DEFAULT_SENSOR,
  DEFAULT_SURVEY_SENSOR,
  defaultRegionOnStartup,
  DEFAULT_CORRELATION_SENSOR,
  resolveSensorWithAliases,
  sensorConfig,
} from './constants';
import modes, { Mode, modeByID, ModeID } from '../modes';
import { formatAPITime, parseAPITime } from '../data/utils';
import { getInfoByName } from '../data/regions';
export { defaultRegionOnStartup, getLevelInfo, levels, levelList } from './constants';
import { timeDay } from 'd3-time';
import { AnnotationManager, fetchAnnotations } from '../data';
import type { RegionInfo, RegionLevel } from '../data/regions';
import { MetaDataManager } from '../data/meta';
import { callMetaAPI } from '../data/api';
import { Sensor, sensorTypes } from '../data/sensor';

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
  const lag = urlParams.get('lag');
  const date = urlParams.get('date') ?? '';

  const modeFromPath = () => {
    const pathName = url.pathname;
    // last path segment, e.g. /test/a -> a, /test/b/ -> b
    return pathName.split('/').filter(Boolean).reverse()[0];
  };
  const mode = urlParams.get('mode') || modeFromPath();

  const modeObj = modes.find((d) => d.id === mode) || DEFAULT_MODE;
  const isGenericPage = modeObj.isGeneric === true;
  // if a generic page, try to resolve but fall back to the given one, since it might be a not configured one
  const resolveSensor = resolveSensorWithAliases(
    sensor,
    isGenericPage
      ? sensor || DEFAULT_SENSOR
      : modeObj === modeByID['survey-results']
      ? DEFAULT_SURVEY_SENSOR
      : DEFAULT_SENSOR,
  );
  return {
    mode: modeObj,
    sensor: resolveSensor,
    sensor2: resolveSensorWithAliases(
      sensor2,
      isGenericPage
        ? sensor2 || DEFAULT_CORRELATION_SENSOR
        : DEFAULT_CORRELATION_SENSOR === sensor2
        ? DEFAULT_SENSOR
        : DEFAULT_CORRELATION_SENSOR,
    ),
    lag: lag ? Number.parseInt(lag, 10) : 0,
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

function resolveSensor(sensor: string, sensorList: Sensor[], metaData: MetaDataManager, defaultKey: string) {
  if (!sensor) {
    return null;
  }
  const configured = sensorList.find((d) => d.key === sensor);
  if (configured) {
    return configured;
  }
  const r = metaData.getSensor(sensor);
  if (r) {
    return r;
  }
  const configuredDefault = sensorList.find((d) => d.key === sensor);
  if (configuredDefault) {
    return configuredDefault;
  }
  return metaData.getSensor(defaultKey);
}

export const metaDataManager = writable(new MetaDataManager([]));

export const sensorList = derived(metaDataManager, (metaData) => {
  return sensorConfig
    .map((d) => {
      const s = metaData.getSensor(d);
      if (s == null) {
        if (metaData.metaSensors.length > 0) {
          // report only when there are some sensors configured
          console.error('invalid configured sensor', d);
        }
        return null;
      }
      return Object.assign({}, s, d) as Sensor;
    })
    .filter((d): d is Sensor => d != null);
});

export const currentSensorEntry = derived(
  [currentSensor, sensorList, metaDataManager],
  // lookup the value, if not found maybe a generic one, if it is set, then return the default, else return the empty one
  ([$currentSensor, sensorList, metaDataManager]) =>
    resolveSensor($currentSensor, sensorList, metaDataManager, DEFAULT_SENSOR),
);

export const currentSensor2 = writable(defaultValues.sensor2);
export const currentSensorEntry2 = derived(
  [currentSensor2, sensorList, metaDataManager],
  ([$currentSensor, sensorList, metaDataManager]) =>
    resolveSensor($currentSensor, sensorList, metaDataManager, DEFAULT_CORRELATION_SENSOR),
);

export const groupedSensorList = derived(sensorList, (sensorList) => {
  return sensorTypes
    .map((sensorType) => ({
      ...sensorType,
      sensors: sensorList.filter(
        (sensor) =>
          // same type or the other catch all type
          sensor.type === sensorType.id ||
          (sensorType.id === 'other' && sensorTypes.every((t) => t.id !== sensor.type)),
      ),
    }))
    .filter((d) => d.sensors.length > 0);
});

export const currentLag = writable(defaultValues.lag);

export const currentDate = writable(defaultValues.date);
/**
 * current date as a Date object
 */
export const currentDateObject = derived([currentDate], ([date]) => (!date ? null : parseAPITime(date)));

// Region GEO_ID for filtering the line chart
// 42003 - Allegheny; 38300 - Pittsburgh; PA - Pennsylvania.
export const currentRegion = writable(defaultValues.region);

/**
 * current region info (could also be null)
 */
export const currentRegionInfo = writable(getInfoByName(defaultValues.region));

function deriveRecent(): RegionInfo[] {
  if (!window.localStorage) {
    return [];
  }
  const item = window.localStorage.getItem('recent') || '';
  if (!item) {
    return [getInfoByName(defaultRegionOnStartup.state)!, getInfoByName(defaultRegionOnStartup.county)!];
  }
  return item
    .split(',')
    .filter(Boolean)
    .map((d) => getInfoByName(d))
    .filter((d): d is RegionInfo => d != null);
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
export function selectByInfo(elem: RegionInfo | null, reset = false): boolean {
  if (elem === get(currentRegionInfo)) {
    if (reset) {
      currentRegion.set('');
      currentRegionInfo.set(null);
    }
    return reset;
  }
  if (elem) {
    currentRegion.set(elem.propertyId);
    // re lookup to have a clean info
    currentRegionInfo.set(getInfoByName(elem.id, elem.level));
    // the info is derived
  } else {
    currentRegion.set('');
    currentRegionInfo.set(null);
  }
  return true;
}

export function selectByFeature(feature: { properties: { id: string; level: RegionLevel } }, reset = false): boolean {
  return selectByInfo(feature ? getInfoByName(feature.properties.id, feature.properties.level) : null, reset);
}

// mobile device detection
// const isDesktop = window.matchMedia('only screen and (min-width: 768px)');

const isMobileQuery = window.matchMedia
  ? window.matchMedia('only screen and (max-width: 767px)')
  : ({ matches: false, addEventListener: () => undefined } as unknown as MediaQueryList);
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

export interface PersistedState {
  mode?: string | null;
  sensor?: string | null;
  sensor2?: string | null;
  lag?: number | null;
  region?: string | null;
  date?: string | null;
}
export interface TrackedState {
  state: PersistedState;
  path: string;
  params: Omit<PersistedState, 'mode'>;
}

export const trackedUrlParams = derived(
  [currentMode, currentSensor, currentSensor2, currentLag, currentRegion, currentDate],
  ([mode, sensor, sensor2, lag, region, date]): TrackedState => {
    // determine parameters based on default value and current mode
    const params: Omit<PersistedState, 'mode'> = {
      sensor:
        mode === modeByID.landing ||
        mode === modeByID.summary ||
        mode === modeByID['survey-results'] ||
        sensor === DEFAULT_SENSOR
          ? null
          : sensor,
      sensor2: mode === modeByID.correlation ? sensor2 : null,
      lag: mode === modeByID.correlation ? lag : null,
      region: mode === modeByID.export ? null : region,
      date:
        String(date) === MAGIC_START_DATE ||
        mode === modeByID.export ||
        mode === modeByID.landing ||
        mode === modeByID['indicator-status']
          ? null
          : String(date),
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

export function getScrollToAnchor(mode: Mode): string | undefined {
  const anchor = mode.anchor;
  delete mode.anchor;
  return anchor;
}
export function switchToMode(mode: Mode, anchor: string): void {
  mode.anchor = anchor;
  currentMode.set(mode);
}

export function loadFromUrlState(state: PersistedState): void {
  if (state.mode !== get(currentMode).id) {
    currentMode.set(modeByID[state.mode as ModeID]);
  }
  if (state.sensor != null && state.sensor !== get(currentSensor)) {
    currentSensor.set(state.sensor);
  }
  if (state.sensor2 != null && state.sensor2 !== get(currentSensor2)) {
    currentSensor2.set(state.sensor2);
  }
  if (state.lag != null && state.lag !== get(currentLag)) {
    currentLag.set(state.lag);
  }
  if (state.region != null && state.region !== get(currentRegion)) {
    selectByInfo(getInfoByName(state.region));
  }
  if (state.date != null && state.date !== get(currentDate)) {
    currentDate.set(state.date);
  }
}

export const annotationManager = writable(new AnnotationManager());

export function loadAnnotations(): void {
  void fetchAnnotations().then((annotations) => {
    annotationManager.set(new AnnotationManager(annotations));
  });
}

export function loadMetaData(): Promise<{ date: string }> {
  return callMetaAPI().then((meta) => {
    const m = new MetaDataManager(meta);
    metaDataManager.set(m);

    const sensor = get(currentSensor);
    const timeEntry = m.getTimeFrame(sensor);

    let date = get(currentDate);
    // Magic number of default date - if no URL params, use max date
    // available
    if (date === MAGIC_START_DATE && timeEntry != null) {
      date = formatAPITime(timeDay.offset(timeEntry.max, get(currentMode) === modeByID['survey-results'] ? 0 : -2));
      currentDate.set(date);
    }
    return {
      date,
    };
  });
}

// validate if sensor and other parameter matches
currentSensorEntry.subscribe((sensorEntry) => {
  if (!sensorEntry) {
    return;
  }

  // clamp to time span
  const timeFrame = get(metaDataManager).getTimeFrame(sensorEntry);
  const current = get(currentDate) ?? '';
  if (current < String(timeFrame.min_time)) {
    currentDate.set(String(timeFrame.min_time));
  } else if (current > String(timeFrame.max_time)) {
    currentDate.set(String(timeFrame.max_time));
  }
});

currentMode.subscribe((mode) => {
  if (mode === modeByID['survey-results'] && get(currentSensor) !== DEFAULT_SURVEY_SENSOR) {
    // change sensor and date to the latest one within the survey
    currentSensor.set(DEFAULT_SURVEY_SENSOR);
    const timeFrame = get(metaDataManager).getTimeFrame(DEFAULT_SURVEY_SENSOR);
    currentDate.set(String(timeFrame.max_time));
  }
});
