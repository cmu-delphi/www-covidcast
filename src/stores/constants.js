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
  'count',
  'countCumulative',
  'avgRatio',
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
    count: checkWIP(signal, signal.replace('7dav_', '')),
    countCumulative: checkWIP(signal, signal.replace('7dav_incidence', 'cumulative')),

    avgRatio: ratioSignal,
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
    return sensorOptions.ratio ? 'countRatioCumulative' : 'countCumulative';
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
    const valueKey = primaryValue(sensorEntry, sensorOptions);
    signal = sensorEntry.casesOrDeathSignals[valueKey];
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

const SafeGraph =
  // prettier-ignore
  '<a href="https://docs.safegraph.com/docs/social-distancing-metrics" target="_blank" rel="noopener noreferrer">SafeGraph</a>';
const aTeamByJohnHopkinsUniversity =
  // prettier-ignore
  '<a href="https://systems.jhu.edu/research/public-health/ncov/" target="_blank" rel="noopener noreferrer">a team at Johns Hopkins University</a>';
const USAFacts =
  // prettier-ignore
  '<a href="https://usafacts.org/visualizations/coronavirus-covid-19-spread-map/" target="_blank" rel="noopener noreferrer">USAFacts</a>';

/**
 * Tooltip/Map Titles and long descriptions should be synced with
 * https://docs.google.com/document/d/1kDqRg8EaI4WQXMaUUbbCGPlsUqEql8kgXCNt6AvMA9I/edit#
 */
/**
 * @type {Partial<SensorEntry>[]}
 */
const defaultSensors = [
  {
    type: 'public',
    name: 'Away from Home 6hr+ a Day',
    // prettier-ignore
    longDescription:
      // prettier-ignore
      `Delphi receives data from ${SafeGraph}, which collects anonymized location data from mobile phones. Using this data, we calculate the fraction of mobile devices that spent more than 6 hours at a location other than their home during the daytime. This indicator measures how mobile people are, and ought to reflect whether people are traveling to work or school outside their homes. See also our Away from Home 3-6hr indicator.`,
    links: [
      {
        alt: 'Technical description',
        href: 'https://cmu-delphi.github.io/delphi-epidata/api/covidcast-signals/safegraph.html',
      },
    ],
    id: 'safegraph',
    signal: 'full_time_work_prop',
    levels: ['county', 'state'],
    mapTitleText:
      // prettier-ignore
      'Fraction of people spending 6 hours or more away from home that day, based on SafeGraph mobility data',
    yAxis: 'Proportion',
    format: 'raw',
    hasStdErr: true,
  },
  {
    type: 'public',
    name: 'Away from Home 3-6hr a Day',
    longDescription:
      // prettier-ignore
      `Delphi receives data from ${SafeGraph}, which collects anonymized location data from mobile phones. Using this data, we calculate the fraction of mobile devices that spent between 3 and 6 hours at a location other than their home during the daytime. This indicator measures how mobile people are. See also our Away from Home 6hr+ indicator.`,
    links: [
      {
        alt: 'Technical description',
        href: 'https://cmu-delphi.github.io/delphi-epidata/api/covidcast-signals/safegraph.html',
      },
    ],
    id: 'safegraph',
    signal: 'part_time_work_prop',
    levels: ['county', 'state'],
    mapTitleText:
      // prettier-ignore
      'Fraction of people spending 3-6 hours away from home that day, based on SafeGraph mobility data',
    yAxis: 'Proportion',
    format: 'raw',
    hasStdErr: true,
  },
  {
    type: 'public',
    name: 'People Wearing Masks',
    longDescription:
      // prettier-ignore
      `Percentage of people who wear a mask most or all of the time while in public, based on surveys of Facebook users.`,
    links: [
      {
        href: 'https://cmu-delphi.github.io/delphi-epidata/api/covidcast-signals/fb-survey.html',
        alt: 'Technical description',
      },
    ],
    id: 'fb-survey',
    signal: 'smoothed_wearing_mask',
    levels: ['county', 'msa', 'state', 'hrr'],
    mapTitleText:
      // prettier-ignore
      'Percentage of people who wear a mask most or all of the time while in public, based on surveys of Facebook users',
    yAxis: 'Percentage',
    format: 'percent',
    hasStdErr: true,
  },
  {
    type: 'public',
    name: 'COVID Searches on Google',
    longDescription:
      // prettier-ignore
      `Using Google Health Trends, Delphi obtains the fraction of COVID-related Google searches out of all Google searches in each area. We use searches for terms related to anosmia (loss of taste or smell), since this emerged as an unusual symptom that is indicative of COVID-19. This indicator is available at the state and metro area (but not county) levels.`,
    links: [
      {
        alt: 'Technical description',
        href: 'https://cmu-delphi.github.io/delphi-epidata/api/covidcast-signals/ght.html',
      },
    ],
    id: 'ght',
    signal: 'smoothed_search',
    levels: ['msa', 'state', 'hrr', 'dma'],
    mapTitleText:
      // prettier-ignore
      'Relative frequency of COVID-related Google searches',
    yAxis: 'Frequency (arbitrary scale)',
    format: 'raw',
    hasStdErr: false,
  },
  {
    type: 'early',
    name: 'COVID-Related Doctor Visits',
    longDescription:
      // prettier-ignore
      `Delphi receives from our health system partners aggregated statistics on COVID-related outpatient doctor visits, derived from ICD codes found in insurance claims. Using this data Delphi estimates the percentage of daily doctor’s visits in each area that are due to COVID-like illness. Note that these estimates are based only on visits by patients whose data is accessible to our partners.`,
    links: [
      {
        alt: 'Technical description',
        href: 'https://cmu-delphi.github.io/delphi-epidata/api/covidcast-signals/doctor-visits.html',
      },
    ],
    id: 'doctor-visits',
    signal: 'smoothed_adj_cli',
    levels: ['county', 'msa', 'state', 'hrr'],
    mapTitleText:
      // prettier-ignore
      'Percentage of daily doctor visits that are due to COVID-like symptoms',
    yAxis: 'Percentage',
    format: 'percent',
    hasStdErr: false,
    // colorScale: interpolateBlues,
  },
  {
    type: 'early',
    name: 'COVID-Like Symptoms',
    longDescription:
      // prettier-ignore
      `Every day, Delphi surveys tens of thousands of Facebook users, asking a broad set of COVID-related questions, including whether they, or anyone in their household, are currently experiencing COVID-related symptoms. We also ask questions about well-being and various mitigation measures, including mask wearing. For this signal, we estimate the percentage of people self-reporting COVID-like symptoms, defined here as fever along with either cough, shortness of breath, or difficulty breathing. While many other conditions can cause these symptoms, comparing the rates of COVID-like symptoms across the country can suggest where COVID is most active.`,
    links: [
      {
        href: 'https://covidcast.cmu.edu/surveys.html',
        alt: 'More information',
      },
      {
        href: 'https://cmu-delphi.github.io/delphi-epidata/api/covidcast-signals/fb-survey.html',
        alt: 'Technical description',
      },
    ],
    id: 'fb-survey',
    signal: 'smoothed_cli',
    levels: ['county', 'msa', 'state', 'hrr'],
    mapTitleText:
      // prettier-ignore
      'Percentage of people with COVID-like symptoms, based on surveys of Facebook users',
    yAxis: 'Percentage',
    format: 'percent',
    hasStdErr: true,
  },
  {
    type: 'early',
    name: 'COVID-Like Symptoms in Community',
    longDescription:
      // prettier-ignore
      `Every day, Delphi surveys tens of thousands of Facebook users, asking them a broad set of COVID-related questions, including whether they, or anyone in their household, are currently experiencing COVID-related symptoms. We also ask them if they know anyone in their local community who has COVID-like or flu-like symptoms, defined here as fever along with either sore throat, cough, shortness of breath, or difficulty breathing.  For this indicator, we estimate the percentage of people who know someone, in their household or outside it, who has these symptoms. While many conditions can cause these symptoms, not just COVID, comparing the rates across the country can suggest where COVID is most active.`,
    links: [
      {
        alt: 'More information',
        href: 'https://covidcast.cmu.edu/surveys.html',
      },
      {
        alt: 'Technical description',
        href: 'https://cmu-delphi.github.io/delphi-epidata/api/covidcast-signals/fb-survey.html',
      },
    ],
    id: 'fb-survey',
    signal: 'smoothed_hh_cmnty_cli',
    levels: ['county', 'msa', 'state', 'hrr'],
    mapTitleText:
      // prettier-ignore
      'Percentage of people who know someone in their local community with COVID-like symptoms, based on surveys of Facebook users',
    yAxis: 'Percentage',
    format: 'percent',
    hasStdErr: true,
  },
  {
    type: 'early',
    name: 'COVID Indicator Combination',
    longDescription:
      // prettier-ignore
      `This data represents a combination of Doctor Visits, COVID-Like Symptoms (from the Delphi survey), COVID-Like Symptoms in Community (from the Delphi survey), and COVID Search on Google. It does not include official reports (cases and deaths), hospital admissions, or SafeGraph signals. We use a rank-1 approximation from a nonnegative matrix factorization approach to identify a single underlying signal that best reconstructs the indicators.  Higher values of the combined signal correspond to higher values of the other indicators, but the scale (units) of the combination is arbitrary.`,
    links: [
      {
        alt: 'Technical description',
        href:
          'https://cmu-delphi.github.io/delphi-epidata/api/covidcast-signals/indicator-combination.html#statistical-combination-signals',
      },
    ],
    id: 'indicator-combination',
    signal: 'nmf_day_doc_fbc_fbs_ght',
    levels: ['county', 'msa', 'state'],
    tooltipText:
      // prettier-ignore
      'Combination of several COVID-19 indicators available at this geographic level',
    mapTitleText:
      // prettier-ignore
      'Combination of several COVID-19 indicators: Doctor Visits, Symptoms, Symptoms in Community, and Search on Google',
    yAxis: 'Combined value (arbitrary scale)',
    format: 'raw',
    hasStdErr: true,
  },
  {
    type: 'late',
    name: 'COVID Antigen Test Positivity (Quidel)',
    longDescription:
      // prettier-ignore
      `When a patient (whether at a doctor’s office, clinic, or hospital) has COVID-like symptoms, doctors may order an antigen test, which can detect parts of the virus that are present during an active infection. Quidel, a national provider of networked lab testing devices, provides us with data from every COVID antigen test that they conduct. We report the percentage of COVID antigen tests that are positive. Note that this signal only includes Quidel’s antigen tests, not those run by other test providers.`,
    links: [
      {
        alt: 'Technical description',
        href: 'https://cmu-delphi.github.io/delphi-epidata/api/covidcast-signals/quidel.html#covid-19-tests',
      },
    ],
    id: 'quidel',
    signal: 'covid_ag_smoothed_pct_positive',
    levels: ['state', 'msa', 'hrr'],
    tooltipText:
      // prettier-ignore
      'Positivity rate of COVID-19 antigen tests, based on data provided by Quidel, Inc.',
    mapTitleText:
      // prettier-ignore
      'Positivity rate of COVID-19 antigen tests',
    yAxis: 'Percentage',
    format: 'percent',
    hasStdErr: true,
  },
  {
    type: 'late',
    name: 'COVID Hospital Admissions',
    longDescription:
      // prettier-ignore
      `Delphi receives from our health system partners aggregated statistics on COVID-related hospital admissions, derived from ICD codes found in insurance claims. Using this data, we estimate the percentage of new hospital admissions each day that are related to COVID-19. Note that these estimates are based only on admissions by patients whose data is accessible to our partners, and address new hospital admissions each day, not all currently hospitalized patients who have COVID-related diagnoses.`,
    links: [
      {
        alt: 'Technical description',
        href: 'https://cmu-delphi.github.io/delphi-epidata/api/covidcast-signals/hospital-admissions.html',
      },
    ],
    id: 'hospital-admissions',
    signal: 'smoothed_adj_covid19_from_claims',
    levels: ['county', 'msa', 'state'],
    mapTitleText:
      // prettier-ignore
      'Percentage of daily hospital admissions with COVID-19 associated diagnoses',
    yAxis: 'Percentage',
    format: 'percent',
    hasStdErr: false,
  },
  {
    type: 'late',
    name: 'COVID Cases',
    longDescription:
      // prettier-ignore
      `This data shows the number of COVID-19 confirmed cases newly reported each day. It reflects only cases reported by state and local health authorities. It is based on case counts compiled and made public by ${USAFacts} and by ${aTeamByJohnHopkinsUniversity}. We use Johns Hopkins data for Puerto Rico and report USAFacts data in all other locations. The signal may not be directly comparable across regions with vastly different testing capacity or reporting criteria.`,
    links: [
      {
        alt: 'Technical description',
        href:
          'https://cmu-delphi.github.io/delphi-epidata/api/covidcast-signals/indicator-combination.html#compositional-signals-confirmed-cases-and-deaths',
      },
    ],
    id: 'indicator-combination',
    signal: 'confirmed_7dav_incidence_num',
    levels: ['msa', 'county', 'state'],
    tooltipText:
      // prettier-ignore
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
      } else if (options.ratio) {
        return 'Newly reported COVID-19 cases per 100,000 people (7-day average)';
      } else {
        return 'Newly reported COVID-19 cases (7-day average)';
      }
    },
    yAxis: 'Cases',
    format: 'raw',
    hasStdErr: false,
  },
  {
    type: 'late',
    name: 'COVID Deaths',
    longDescription:
      // prettier-ignore
      `This data shows the number of COVID-19 related deaths newly reported each day. It reflects official figures reported by state and local health authorities, and may not include excess deaths not confirmed by health authorities to be due to COVID-19. The signal is based on death counts compiled and made public by ${USAFacts} and by ${aTeamByJohnHopkinsUniversity}. We use Johns Hopkins data for Puerto Rico and report USAFacts data in all other locations.`,
    links: [
      {
        alt: 'Technical description',
        href:
          'https://cmu-delphi.github.io/delphi-epidata/api/covidcast-signals/indicator-combination.html#compositional-signals-confirmed-cases-and-deaths',
      },
    ],
    id: 'indicator-combination',
    signal: 'deaths_7dav_incidence_num',
    levels: ['msa', 'county', 'state'],
    tooltipText:
      // prettier-ignore
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
        }
      } else if (options.ratio) {
        return 'Newly reported COVID-19 deaths per 100,000 people (7-day average)';
      } else {
        return 'Newly reported COVID-19 deaths (7-day average)';
      }
    },
    yAxis: 'Deaths',
    format: 'raw',
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
    label: 'Public’s Behavior',
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
