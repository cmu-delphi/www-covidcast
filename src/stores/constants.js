import { formatAPITime, isCasesSignal, isDeathSignal, isCountSignal, isPropSignal } from '../data';
import { format } from 'd3';

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
export const defaultSensorId = 'doctor-visits';

/**
 * @typedef {object} SensorEntry
 * @property {string} key
 * @property {string} name
 * @property {string} id
 * @property {string} signal
 * @property {string} tooltipText
 * @property {string} chartTitleText
 * @property {string} yAxis
 * @property {string} format
 * @property {(v: number) => string} formatValue
 * @property {string} signal
 * @property {string[]} levels
 * @property {'public' | 'early' | 'late'} type
 * @property {string?} api
 * @property {boolean} isCount is a count signal
 * @property {boolean} isCasesOrDeath is a cases or death signal
 * @property {boolean} isProp is a prop signal
 */

const basePercentFormatter = format('.2%');
const percentFormatter = (v) => basePercentFormatter(v / 100);
const intFormatter = format(',d');
const rawFormatter = format(',.2');

export function extendSensorEntry(sensorEntry) {
  const key = `${sensorEntry.id}-${sensorEntry.signal}`;
  const isCasesOrDeath = isCasesSignal(key) || isDeathSignal(key);
  const isCount = isCountSignal(key);
  const isProp = isPropSignal(key);
  return Object.assign(sensorEntry, {
    key,
    isCasesOrDeath,
    isCount,
    isProp,
    formatValue: sensorEntry.format === 'percent' ? percentFormatter : isCasesOrDeath ? intFormatter : rawFormatter,
  });
}

/**
 * @type {SensorEntry[]}
 */
export const sensorList = [
  {
    name: 'Away from Home 6hr+ (SG)',
    id: 'safegraph',
    tooltipText: 'Proportion of people spending 6 hours or more away from home, based on SafeGraph mobility data',
    mapTitleText: 'Proportion of people spending 6 hours or more away from home, based on SafeGraph mobility data',
    chartTitleText: 'Proportion of people spending 6 hours or more away from home, based on SafeGraph mobility data',
    yAxis: 'Proportion',
    format: 'raw',
    signal: 'full_time_work_prop',
    levels: ['county', 'state'],
    type: 'public',
  },
  {
    name: 'Away from Home 3-6hr (SG)',
    id: 'safegraph',
    tooltipText: 'Proportion of people spending 3-6 hours away from home, based on SafeGraph mobility data',
    mapTitleText: 'Proportion of people spending 3-6 hours away from home, based on SafeGraph mobility data',
    chartTitleText: 'Proportion of people spending 3-6 hours away from home, based on SafeGraph mobility data',
    yAxis: 'Proportion',
    format: 'raw',
    signal: 'part_time_work_prop',
    levels: ['county', 'state'],
    type: 'public',
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
    type: 'public',
  },
  {
    name: 'Doctor Visits',
    id: 'doctor-visits',
    tooltipText: 'Percentage of daily doctor visits that are due to COVID-like symptoms',
    mapTitleText: 'Percentage of daily doctor visits that are due to COVID-like symptoms',
    chartTitleText: 'Percentage of daily doctor visits that are due to COVID-like symptoms',
    yAxis: 'Percentage',
    format: 'percent',
    signal: 'smoothed_adj_cli',
    levels: ['county', 'msa', 'state'],
    type: 'early',
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
    type: 'early',
  },
  {
    name: 'Symptoms in Community (FB)',
    id: 'fb-survey',
    tooltipText:
      'Percentage of people who know someone in their local community with COVID-like symptoms, based on Facebook surveys',
    mapTitleText:
      'Percentage of people who know someone in their local community with COVID-like symptoms, based on Facebook surveys',
    chartTitleText:
      'Percentage of people who know someone in their local community with COVID-like symptoms, based on Facebook surveys',
    yAxis: 'Percentage',
    format: 'percent',
    signal: 'smoothed_hh_cmnty_cli',
    levels: ['county', 'msa', 'state'],
    type: 'early',
  },
  {
    name: 'Combined',
    id: 'indicator-combination',
    tooltipText: 'Combination of COVID-19 indicators available at this geographic level',
    mapTitleText: 'Combination of COVID-19 indicators',
    chartTitleText: 'Combination of COVID-19 indicators',
    yAxis: 'Combined value (arbitrary scale)',
    format: 'raw',
    signal: 'nmf_day_doc_fbc_fbs_ght',
    levels: ['county', 'msa', 'state'],
    type: 'early',
  },
  {
    name: 'COVID-19 Antigen Tests (Quidel)',
    id: 'quidel',
    tooltipText: 'Daily test positivity rate for COVID-19 antigens, based on data provided by Quidel, Inc.',
    mapTitleText: 'Daily test positivity rate for COVID-19 antigens',
    chartTitleText: 'Daily test positivity rate for COVID-19 antigens',
    yAxis: 'Percentage',
    format: 'percent',
    signal: 'covid_ag_smoothed_pct_positive',
    minTime: 20200526,
    maxTime: 20200728,
    mean: 8.843758597635844,
    std: 6.666398435382195,
    levels: ['state', 'msa', 'hrr'],
    type: 'late',
  },
  {
    name: 'Hospital Admissions',
    id: 'hospital-admissions',
    tooltipText: 'Percentage of daily hospital admissions with COVID-19 associated diagnoses',
    mapTitleText: 'Percentage of daily hospital admissions with COVID-19 associated diagnoses',
    chartTitleText: 'Percentage of daily hospital admissions with COVID-19 associated diagnoses',
    yAxis: 'Percentage',
    format: 'percent',
    signal: 'smoothed_adj_covid19',
    levels: ['county', 'msa', 'state'],
    type: 'late',
  },
  {
    name: 'Cases',
    id: 'indicator-combination',
    tooltipText:
      'Daily new confirmed COVID-19 cases (7-day average), based on data reported by USAFacts and Johns Hopkins University',
    mapTitleText: 'Daily new confirmed COVID-19 cases (7-day average)',
    chartTitleText: 'Daily new confirmed COVID-19 cases (7-day average)',
    yAxis: 'Cases',
    format: 'raw',
    signal: 'confirmed_7dav_incidence_num',
    levels: ['msa', 'county', 'state'],
    type: 'late',
  },
  {
    name: 'Cases per 100,000 People',
    id: 'indicator-combination',
    tooltipText:
      'Daily new confirmed COVID-19 cases per 100,000 people (7-day average), based on data reported by USAFacts and Johns Hopkins University',
    mapTitleText: 'Daily new confirmed COVID-19 cases per 100,000 people (7-day average)',
    chartTitleText: 'Daily new confirmed COVID-19 cases per 100,000 people (7-day average)',
    yAxis: 'Cases per 100,000 people',
    format: 'raw',
    signal: 'confirmed_7dav_incidence_prop',
    levels: ['msa', 'county', 'state'],
    type: 'late',
  },
  {
    name: 'Deaths',
    id: 'indicator-combination',
    tooltipText:
      'Daily new COVID-19 deaths (7-day average), based on data reported by USAFacts and Johns Hopkins University',
    mapTitleText: 'Daily new COVID-19 deaths (7-day average)',
    chartTitleText: 'Daily new COVID-19 deaths (7-day average)',
    yAxis: 'Deaths',
    format: 'raw',
    signal: 'deaths_7dav_incidence_num',
    levels: ['msa', 'county', 'state'],
    type: 'late',
  },
  {
    name: 'Deaths per 100,000 People',
    id: 'indicator-combination',
    tooltipText:
      'Daily new COVID-19 deaths per 100,000 people (7-day average), based on data reported by USAFacts and Johns Hopkins University',
    mapTitleText: 'Daily new COVID-19 deaths per 100,000 people (7-day average)',
    chartTitleText: 'Daily new COVID-19 deaths per 100,000 people (7-day average)',
    yAxis: 'Deaths per 100,000 people',
    format: 'raw',
    signal: 'deaths_7dav_incidence_prop',
    levels: ['msa', 'county', 'state'],
    type: 'late',
  },
].map(extendSensorEntry);

export const defaultRegionOnStartup = {
  county: '42003', // Allegheny
  msa: '38300', // Pittsburgh
  state: 'PA', // Pennsylvania
};

export const yesterdayDate = new Date(new Date().getTime() - 86400 * 1000);
export const yesterday = Number.parseInt(formatAPITime(yesterdayDate), 10);
