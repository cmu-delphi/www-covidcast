import { formatAPITime, isCasesSignal, isDeathSignal, isPropSignal, isCountSignal } from '../data';
import { checkWIP } from '../data/utils';
import { format } from 'd3-format';
// import { generateMockSignal, generateMockMeta } from '../data/mock';

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

export const swpaLevelList = levelList.concat([
  {
    id: 'zip',
    label: 'Zip Code',
    labelPlural: 'Zip Codes',
  },
  {
    id: 'neighborhood',
    label: 'Neighborhood/Municipal',
    labelPlural: 'Neighborhoods/Municipals',
  },
]);
export const swpaLevels = swpaLevelList.map((l) => l.id);

const levelById = new Map([...levelList, ...swpaLevelList].map((l) => [l.id, l]));

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
 * @typedef {object} CasesOrDeathOptions
 * @property {boolean} cumulative
 * @property {boolean} ratio
 */

/**
 * @typedef {object} SensorEntry
 * @property {string} key
 * @property {'public' | 'early' | 'late'} type
 * @property {string} name
 * @property {string} id
 * @property {string} signal
 * @property {string[]} levels
 * @property {string | ((options?: CasesOrDeathOptions) => string)} tooltipText
 * @property {string | ((options?: CasesOrDeathOptions) => string)} mapTitleText
 * @property {string} yAxis
 * @property {string} format
 * @property {(v: number) => string} formatValue
 * @property {string} signal
 * @property {string?|() => any[]} api
 * @property {(() => any[])?} meta
 * @property {(v: number) => string} formatValue
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
 * @property {number} avgRatio
 * @property {number} countRatio
 * @property {number} avgRatioCumulative
 * @property {number} countRatioCumulative
 */

/**
 * @type {(keyof EpiDataCasesOrDeathValues)[]}
 */
export const EPIDATA_CASES_OR_DEATH_VALUES = [
  'avg',
  'avgCumulative',
  'count',
  'countCumulative',
  'avgRatio',
  'avgRatioCumulative',
  'countRatio',
  'countRatioCumulative',
];

const basePercentFormatter = format('.2%');
const percentFormatter = (v) => basePercentFormatter(v / 100);
const intFormatter = format(',d');
const rawFormatter = format(',.2f');

function generateCasesOrDeathSignals(signal) {
  const ratioSignal = signal.replace('_num', '_prop');
  return {
    avg: signal,
    avgCumulative: checkWIP(signal, signal.replace('incidence', 'cumulative')),
    count: checkWIP(signal, signal.replace('7dav_', '')),
    countCumulative: checkWIP(signal, signal.replace('7dav_incidence', 'cumulative')),

    avgRatio: ratioSignal,
    avgRatioCumulative: checkWIP(ratioSignal, ratioSignal.replace('incidence', 'cumulative')),
    countRatio: checkWIP(ratioSignal, ratioSignal.replace('7dav_', '')),
    countRatioCumulative: checkWIP(ratioSignal, ratioSignal.replace('7dav_incidence', 'cumulative')),
  };
}

/**
 * determines the primary value to show or lookup
 * @param {SensorEntry} sensorEntry
 * @param {CasesOrDeathOptions} sensorOptions
 */
export function primaryValue(sensorEntry, sensorOptions) {
  if (!sensorEntry.isCasesOrDeath) {
    return 'value';
  }
  if (sensorOptions.cumulative) {
    return sensorOptions.ratio ? 'avgRatioCumulative' : 'avgCumulative';
  }
  return sensorOptions.ratio ? 'avgRatio' : 'avg';
}

/**
 *
 * @param {*} sensorEntry
 */
export function extendSensorEntry(sensorEntry) {
  const key = `${sensorEntry.id}-${sensorEntry.signal}`;
  const isCasesOrDeath = isCasesSignal(key) || isDeathSignal(key);
  const isCount = isCountSignal(key);
  const signal = sensorEntry.signal;
  return Object.assign(sensorEntry, {
    key,
    tooltipText: sensorEntry.tooltipText || sensorEntry.mapTitleText,
    formatValue: sensorEntry.format === 'percent' ? percentFormatter : isCount ? intFormatter : rawFormatter,
    isCount,
    isProp: isPropSignal(key),
    isCasesOrDeath,
    casesOrDeathSignals: isCasesOrDeath ? generateCasesOrDeathSignals(signal) : {},
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
    mapTitleText: (options) => {
      if (!options) {
        return 'Daily new COVID-19 cases (7-day average)';
      }
      if (options.cumulative) {
        if (options.ratio) {
          return 'Cumulated daily new COVID-19 cases per 100,000 people (7-day average)';
        } else {
          return 'Cumulated daily new COVID-19 cases (7-day average)';
        }
      } else if (options.ratio) {
        return 'Daily new COVID-19 cases per 100,000 people (7-day average)';
      } else {
        return 'Daily new COVID-19 cases (7-day average)';
      }
    },
    yAxis: 'Cases',
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
    mapTitleText: (options) => {
      if (!options) {
        return 'Daily new COVID-19 deaths (7-day average)';
      }
      if (options.cumulative) {
        if (options.ratio) {
          return 'Cumulated daily new COVID-19 deaths per 100,000 people (7-day average)';
        } else {
          return 'Cumulated daily new COVID-19 deaths (7-day average)';
        }
      } else if (options.ratio) {
        return 'Daily new COVID-19 deaths per 100,000 people (7-day average)';
      } else {
        return 'Daily new COVID-19 deaths (7-day average)';
      }
    },
    yAxis: 'Deaths',
    format: 'raw',
  },
  // {
  //   type: 'other',
  //   name: 'Mock Signal',
  //   id: 'mock',
  //   signal: 'mock',
  //   levels: ['county', 'state', 'msa', 'neighborhood', 'zip'],
  //   tooltipText: 'Mock Signal',
  //   mapTitleText: 'Mock Signal',
  //   yAxis: 'Mock Signal',
  //   format: 'percent',
  //   api: generateMockSignal,
  //   meta: generateMockMeta,
  // },
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
