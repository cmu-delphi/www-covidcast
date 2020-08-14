import { formatAPITime, isCasesSignal, isDeathSignal, isPropSignal, isCountSignal } from '../data';
import { checkWIP } from '../data/utils';

export const levelList = [
  {
    id: 'state',
    label: 'State',
    labelPlural: 'States',
  },
  {
    id: 'msa',
    label: 'Metro Area',
    labelPlural: 'Metro Areas',
  },
  {
    id: 'county',
    label: 'County',
    labelPlural: 'Counties',
  },
];
export const levels = levelList.map((l) => l.id);

export const levelMegaCounty = {
  id: 'mega-county',
  label: 'Mega County',
  labelPlural: 'Mega Counties',
};
export const levelsWithMega = levels.concat(levelMegaCounty.id);

const levelById = new Map(levelList.map((l) => [l.id, l]));

export function getLevelInfo(level) {
  return (
    levelById.get(level) || {
      id: '?',
      label: 'Invalid level',
      labelPlural: 'Invalid level',
    }
  );
}

/**
 * @typedef {object} SensorEntry
 * @property {string} key
 * @property {'public' | 'early' | 'late'} type
 * @property {string} name
 * @property {string} id
 * @property {string} signal
 * @property {string[]} levels
 * @property {string} tooltipText
 * @property {string} yAxis
 * @property {string} format
 * @property {string} signal
 * @property {string?} api
 * @property {boolean} isCasesOrDeath is cases or death signal
 * @property {boolean} isCount is count signal
 * @property {boolean} isProp is prop signal
 * @property {Record<keyof EpiDataCasesOrDeathValues, string>} casesOrDeathSignals signal to load for cases or death
 */

/**
 * @typedef {object} EpiDataCasesOrDeathValues
 * @property {number} avg
 * @property {number} count
 * @property {number} avgCumulative
 * @property {number} countCumulative
 */

/**
 * @type {(keyof EpiDataCasesOrDeathValues)[]}
 */
export const EPIDATA_CASES_OR_DEATH_VALUES = ['avg', 'avgCumulative', 'count', 'countCumulative'];

/**
 *
 * @param {*} sensorEntry
 */
export function extendSensorEntry(sensorEntry) {
  const key = `${sensorEntry.id}-${sensorEntry.signal}`;
  const isCasesOrDeath = isCasesSignal(key) || isDeathSignal(key);
  return Object.assign(sensorEntry, {
    key,
    isCount: isCountSignal(key),
    isProp: isPropSignal(key),
    isCasesOrDeath,
    casesOrDeathSignals: isCasesOrDeath
      ? {
          avg: sensorEntry.signal,
          avgCumulative: checkWIP(sensorEntry.signal, sensorEntry.signal.replace('incidence', 'cumulative')),
          count: checkWIP(sensorEntry.signal, sensorEntry.signal.replace('7dav_', '')),
          countCumulative: checkWIP(sensorEntry.signal, sensorEntry.signal.replace('7dav_incidence', 'cumulative')),
        }
      : {},
  });
}

export const defaultSensorId = 'doctor-visits';

const defaultSensors = [
  {
    type: 'public',
    name: 'Away from Home 6hr+ (SG)',
    id: 'safegraph',
    signal: 'full_time_work_prop',
    levels: ['county', 'state'],
    tooltipText: 'Proportion of people spending 6 hours or more away from home, based on SafeGraph mobility data',
    mapTitleText: 'Proportion of people spending 6 hours or more away from home, based on SafeGraph mobility data',
    yAxis: 'Proportion',
    format: 'raw',
  },
  {
    type: 'public',
    name: 'Away from Home 3-6hr (SG)',
    id: 'safegraph',
    signal: 'part_time_work_prop',
    levels: ['county', 'state'],
    tooltipText: 'Proportion of people spending 3-6 hours away from home, based on SafeGraph mobility data',
    mapTitleText: 'Proportion of people spending 3-6 hours away from home, based on SafeGraph mobility data',
    yAxis: 'Proportion',
    format: 'raw',
  },
  {
    type: 'public',
    name: 'Search Trends (Google)',
    id: 'ght',
    signal: 'smoothed_search',
    levels: ['msa', 'state', 'hrr', 'dma'],
    tooltipText: 'Relative frequency of COVID-related Google searches',
    mapTitleText: 'Relative frequency of COVID-related Google searches',
    yAxis: 'Frequency (arbitrary scale)',
    format: 'raw',
  },
  {
    type: 'early',
    name: 'Doctor Visits',
    id: 'doctor-visits',
    signal: 'smoothed_adj_cli',
    levels: ['county', 'msa', 'state', 'hrr'],
    tooltipText: 'Percentage of daily doctor visits that are due to COVID-like symptoms',
    mapTitleText: 'Percentage of daily doctor visits that are due to COVID-like symptoms',
    yAxis: 'Percentage',
    format: 'percent',
  },
  {
    type: 'early',
    name: 'Symptoms (FB)',
    id: 'fb-survey',
    signal: 'smoothed_cli',
    levels: ['county', 'msa', 'state', 'hrr'],
    tooltipText: 'Percentage of people with COVID-like symptoms, based on Facebook surveys',
    mapTitleText: 'Percentage of people with COVID-like symptoms, based on Facebook surveys',
    yAxis: 'Percentage',
    format: 'percent',
  },
  {
    type: 'early',
    name: 'Symptoms in Community (FB)',
    id: 'fb-survey',
    signal: 'smoothed_hh_cmnty_cli',
    levels: ['county', 'msa', 'state', 'hrr'],
    tooltipText:
      'Percentage of people who know someone in their local community with COVID-like symptoms, based on Facebook surveys',
    mapTitleText:
      'Percentage of people who know someone in their local community with COVID-like symptoms, based on Facebook surveys',
    yAxis: 'Percentage',
    format: 'percent',
  },
  {
    type: 'early',
    name: 'Combined',
    id: 'indicator-combination',
    signal: 'nmf_day_doc_fbc_fbs_ght',
    levels: ['county', 'msa', 'state'],
    tooltipText: 'Combination of COVID-19 indicators available at this geographic level',
    mapTitleText: 'Combination of COVID-19 indicators',
    yAxis: 'Combined value (arbitrary scale)',
    format: 'raw',
  },
  {
    type: 'late',
    name: 'COVID-19 Antigen Tests (Quidel)',
    id: 'quidel',
    signal: 'covid_ag_smoothed_pct_positive',
    levels: ['state', 'msa', 'hrr'],
    tooltipText: 'Daily test positivity rate for COVID-19 antigens, based on data provided by Quidel, Inc.',
    mapTitleText: 'Daily test positivity rate for COVID-19 antigens',
    yAxis: 'Percentage',
    format: 'percent',
  },
  {
    type: 'late',
    name: 'Hospital Admissions',
    id: 'hospital-admissions',
    signal: 'smoothed_adj_covid19',
    levels: ['county', 'msa', 'state'],
    tooltipText: 'Percentage of daily hospital admissions with COVID-19 associated diagnoses',
    mapTitleText: 'Percentage of daily hospital admissions with COVID-19 associated diagnoses',
    yAxis: 'Percentage',
    format: 'percent',
  },
  {
    type: 'late',
    name: 'Cases',
    id: 'indicator-combination',
    signal: 'confirmed_7dav_incidence_num',
    levels: ['msa', 'county', 'state'],
    tooltipText:
      'Daily new confirmed COVID-19 cases (7-day average), based on data reported by USAFacts and Johns Hopkins University',
    mapTitleText: 'Daily new confirmed COVID-19 cases (7-day average)',
    yAxis: 'Cases',
    format: 'raw',
  },
  {
    type: 'late',
    name: 'Cases per 100,000 People',
    id: 'indicator-combination',
    signal: 'confirmed_7dav_incidence_prop',
    levels: ['msa', 'county', 'state'],
    tooltipText:
      'Daily new confirmed COVID-19 cases per 100,000 people (7-day average), based on data reported by USAFacts and Johns Hopkins University',
    mapTitleText: 'Daily new confirmed COVID-19 cases per 100,000 people (7-day average)',
    yAxis: 'Cases per 100,000 people',
    format: 'raw',
  },
  {
    type: 'late',
    name: 'Deaths',
    id: 'indicator-combination',
    signal: 'deaths_7dav_incidence_num',
    levels: ['msa', 'county', 'state'],
    tooltipText:
      'Daily new COVID-19 deaths (7-day average), based on data reported by USAFacts and Johns Hopkins University',
    mapTitleText: 'Daily new COVID-19 deaths (7-day average)',
    yAxis: 'Deaths',
    format: 'raw',
  },
  {
    type: 'late',
    name: 'Deaths per 100,000 People',
    id: 'indicator-combination',
    signal: 'deaths_7dav_incidence_prop',
    levels: ['msa', 'county', 'state', 'hrr'],
    tooltipText:
      'Daily new COVID-19 deaths per 100,000 people (7-day average), based on data reported by USAFacts and Johns Hopkins University',
    mapTitleText: 'Daily new COVID-19 deaths per 100,000 people (7-day average)',
    yAxis: 'Deaths per 100,000 people',
    format: 'raw',
  },
];

/**
 * @type {SensorEntry[]}
 */
export const sensorList = (() => {
  const queryString = window.location.search;
  const urlParams = new URLSearchParams(queryString);
  const sensorsOption = urlParams.get('sensors');
  if (sensorsOption) {
    return JSON.parse(decodeURIComponent(sensorsOption)).map(extendSensorEntry);
  } else {
    return defaultSensors.map(extendSensorEntry);
  }
})();

export const sensorMap = new Map(sensorList.map((s) => [s.key, s]));

const sensorTypes = [
  {
    id: 'public',
    label: 'Public Behavior',
  },
  {
    id: 'early',
    label: 'Early Indicators',
  },
  {
    id: 'late',
    label: 'Late Indicators',
  },
  {
    id: 'other',
    label: 'Other Indicators',
  },
];

export const groupedSensorList = sensorTypes
  .map((sensorType) => ({
    ...sensorType,
    sensors: sensorList.filter(
      (sensor) =>
        // same type or the other catch all type
        sensor.type === sensorType.id || (sensorType.id === 'other' && sensorTypes.every((t) => t.id !== sensor.type)),
    ),
  }))
  .filter((d) => d.sensors.length > 0);

export const defaultRegionOnStartup = {
  county: '42003', // Allegheny
  msa: '38300', // Pittsburgh
  state: 'PA', // Pennsylvania
};

export const yesterdayDate = new Date(new Date().getTime() - 86400 * 1000);
export const yesterday = Number.parseInt(formatAPITime(yesterdayDate), 10);
