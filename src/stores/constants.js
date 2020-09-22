import { formatAPITime, isCasesSignal, isDeathSignal, isPropSignal, isCountSignal } from '../data';
import { interpolateYlOrRd } from 'd3-scale-chromatic';
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
      id: level,
      label: level.toUpperCase(),
      labelPlural: level.toUpperCase(),
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
 * @property {string?} longDescription
 * @property {{alt: string, href: string}[]} links
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
 * @property {boolean} hasStdErr
 * @property {boolean} isCasesOrDeath is cases or death signal
 * @property {boolean} isCount is count signal
 * @property {(options?: CasesOrDeathOptions) => 'prop' | 'count' | 'other')} getType
 * @property {Record<keyof EpiDataCasesOrDeathValues, string>} casesOrDeathSignals signal to load for cases or death
 * @property {)(v: number) => string)} colorScale
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
const countFormatter = format(',.1f');
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
 * determines the primary value to show or lookup
 * @param {SensorEntry} sensorEntry
 * @param {CasesOrDeathOptions} sensorOptions
 */
function getType(sensorEntry, sensorOptions) {
  let signal = sensorEntry.signal;
  if (sensorEntry.isCasesOrDeath) {
    if (sensorOptions.cumulative) {
      signal = sensorEntry.casesOrDeathSignals[sensorOptions.ratio ? 'avgRatioCumulative' : 'avgCumulative'];
    } else {
      signal = sensorEntry.casesOrDeathSignals[sensorOptions.ratio ? 'avgRatio' : 'avg'];
    }
  }
  if (isCountSignal(signal)) {
    return 'count';
  }
  if (isPropSignal(signal)) {
    return 'prop';
  }
  return 'other';
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
    formatValue: sensorEntry.format === 'percent' ? percentFormatter : isCount ? countFormatter : rawFormatter,
    isCount,
    getType: (options) => getType(sensorEntry, options),
    isCasesOrDeath,
    casesOrDeathSignals: isCasesOrDeath ? generateCasesOrDeathSignals(signal) : {},
    colorScale: sensorEntry.colorScale || interpolateYlOrRd,
    links: sensorEntry.links || [],
  });
}

export const defaultSensorId = 'doctor-visits';

/**
 * @type {Partial<SensorEntry>[]}
 */
const defaultSensors = [
  {
    name: 'Away from Home 6hr+',
    id: 'safegraph',
    tooltipText: 'Proportion of people spending 6 hours or more away from home that day, based on SafeGraph mobility data',
    mapTitleText: 'Proportion of people spending 6 hours or more away from home that day, based on SafeGraph mobility data',
    yAxis: 'Proportion',
    format: 'raw',
    signal: 'full_time_work_prop',
    levels: ['county', 'state'],
    type: 'public',
    hasStdErr: true,
  },
  {
    name: 'Away from Home 3-6hr',
    id: 'safegraph',
    tooltipText: 'Proportion of people spending 3-6 hours away from home that day, based on SafeGraph mobility data',
    mapTitleText: 'Proportion of people spending 3-6 hours away from home that day, based on SafeGraph mobility data',
    yAxis: 'Proportion',
    format: 'raw',
    signal: 'part_time_work_prop',
    levels: ['county', 'state'],
    type: 'public',
    hasStdErr: true,
  },
  {
    name: 'COVID Searches on Google',
    id: 'ght',
    tooltipText: 'Relative frequency of COVID-related Google searches',
    mapTitleText: 'Relative frequency of COVID-related Google searches',
    yAxis: 'Frequency (arbitrary scale)',
    format: 'raw',
    signal: 'smoothed_search',
    levels: ['msa', 'state', 'hrr', 'dma'],
    type: 'public',
    hasStdErr: false,
  },
  {
    name: 'COVID-Related Doctor Visits',
    id: 'doctor-visits',
    tooltipText: 'Percentage of daily doctor visits that are due to COVID-like symptoms',
    mapTitleText: 'Percentage of daily doctor visits that are due to COVID-like symptoms',
    yAxis: 'Percentage',
    format: 'percent',
    signal: 'smoothed_adj_cli',
    levels: ['county', 'msa', 'state', 'hrr'],
    type: 'early',
    hasStdErr: false,
    // colorScale: interpolateBlues,
  },
  {
    name: 'COVID-Like Symptoms',
    id: 'fb-survey',
    tooltipText: 'Percentage of people with COVID-like symptoms, based on surveys of Facebook users',
    mapTitleText: 'Percentage of people with COVID-like symptoms, based on surveys of Facebook users',
    yAxis: 'Percentage',
    format: 'percent',
    signal: 'smoothed_cli',
    levels: ['county', 'msa', 'state', 'hrr'],
    type: 'early',
    hasStdErr: true,
  },
  {
    name: 'COVID-Like Symptoms in Community',
    id: 'fb-survey',
    tooltipText:
      'Percentage of people who know someone in their local community with COVID-like symptoms, based on surveys of Facebook users',
    mapTitleText:
      'Percentage of people who know someone in their local community with COVID-like symptoms, based on surveys of Facebook users',
    yAxis: 'Percentage',
    format: 'percent',
    signal: 'smoothed_hh_cmnty_cli',
    levels: ['county', 'msa', 'state', 'hrr'],
    type: 'early',
    hasStdErr: true,
  },
  {
    name: 'COVID Indicator Combination',
    id: 'indicator-combination',
    tooltipText: 'Combination of several COVID-19 indicators available at this geographic level',
    mapTitleText: 'Combination of several COVID-19 indicators: Doctor Visits, Symptom Surveys, and Google Search Trends',
    yAxis: 'Combined value (arbitrary scale)',
    format: 'raw',
    signal: 'nmf_day_doc_fbc_fbs_ght',
    levels: ['county', 'msa', 'state'],
    type: 'early',
    hasStdErr: true,
  },
  {
    name: 'COVID Antigen Test Positivity (Quidel)',
    id: 'quidel',
    tooltipText: 'Positivity rate of COVID-19 antigen tests, based on data provided by Quidel, Inc.',
    mapTitleText: 'Positivity rate of COVID-19 antigen tests',
    yAxis: 'Percentage',
    format: 'percent',
    signal: 'covid_ag_smoothed_pct_positive',
    levels: ['msa', 'state', 'hrr'],
    type: 'late',
    hasStdErr: true,
  },
  {
    name: 'COVID Hospital Admissions',
    id: 'hospital-admissions',
    tooltipText: 'Percentage of daily hospital admissions with COVID-19 associated diagnoses',
    mapTitleText: 'Percentage of daily hospital admissions with COVID-19 associated diagnoses',
    yAxis: 'Percentage',
    format: 'percent',
    signal: 'smoothed_adj_covid19',
    levels: ['county', 'msa', 'state'],
    type: 'late',
    hasStdErr: false,
  },
  {
    name: 'COVID Cases',
    id: 'indicator-combination',
    tooltipText:
      'Newly reported COVID-19 cases, based on data from USAFacts and Johns Hopkins University',
    mapTitleText: (options) => {
      if (!options) {
        return 'Newly reported COVID-19 cases (7-day average)';
      }
      if (options.cumulative) {
        if (options.ratio) {
          return 'Cumulative reported COVID-19 cases per 100,000 people';
        } else {
          return 'Cumulative reported COVID-19 cases';
        }
      }[a] else if (options.ratio) {
        return 'Newly reported COVID-19 cases per 100,000 people (7-day average)';
      } else {
        return 'Newly reported COVID-19 cases (7-day average)';
      }
    },
    yAxis: 'Cases',
    format: 'raw',
    signal: 'confirmed_7dav_incidence_num',
    levels: ['msa', 'county', 'state'],
    type: 'late',
    hasStdErr: false,
  },
  {
    name: 'COVID Deaths',
    id: 'indicator-combination',
    tooltipText:
      'Newly reported COVID-19 deaths, based on data from USAFacts and Johns Hopkins University',
    mapTitleText: (options) => {
      if (!options) {
        return 'Newly reported COVID-19 deaths (7-day average)';
      }
      if (options.cumulative) {
        if (options.ratio) {
          return 'Cumulative reported COVID-19 deaths per 100,000 people';
        } else {
          return 'Cumulative reported COVID-19 deaths';
        }[b]
      } else if (options.ratio) {
        return 'Newly reported COVID-19 deaths per 100,000 people (7-day average)';
      } else {
        return 'Newly reported COVID-19 deaths (7-day average)';
      }
    },
    yAxis: 'Deaths',
    format: 'raw',
    signal: 'deaths_7dav_incidence_num',
    levels: ['msa', 'county', 'state'],
    type: 'late',
    hasStdErr: false,
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
