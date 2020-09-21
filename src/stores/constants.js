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

const basePercentFormatter = format('.1%');
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
    type: 'early',
    name: 'Doctor Visits',
    longDescription: `<p>Delphi receives outpatient doctor visits data from our health system partners.
    Using this data, which is de-identified, Delphi estimates the percentage of daily doctor’s visits in each area
     that are related to COVID. Note that this can only report on regions and patients whose data is observed by our partners.
     </p>`,
    links: [
      {
        alt: 'Technical description',
        href: 'https://cmu-delphi.github.io/delphi-epidata/api/covidcast-signals/doctor-visits.html',
      },
    ],
    id: 'doctor-visits',
    signal: 'smoothed_adj_cli',
    levels: ['county', 'msa', 'state', 'hrr'],
    mapTitleText: 'Percentage of daily doctor visits that are due to COVID-like symptoms',
    yAxis: 'Percentage',
    format: 'percent',
    hasStdErr: false,
    // colorScale: interpolateBlues,
  },
  {
    type: 'early',
    name: 'Symptoms (FB)',
    longDescription: `<p>Each day, Delphi surveys tens of thousands of Facebook users
    and asks them if they or anyone in their household are currently experiencing symptoms.
    Based on the survey results, we estimate the percentage of people with COVID-like
    symptoms. A person has "COVID-like" symptoms if they have a fever, along with either
    cough, shortness of breath, or difficulty breathing. While many other conditions
    can cause these symptoms, comparing the rates of COVID-like symptoms across the
    country can suggest where COVID is most active.</p>`,
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
    mapTitleText: 'Percentage of people with COVID-like symptoms, based on Facebook surveys',
    yAxis: 'Percentage',
    format: 'percent',
    hasStdErr: true,
  },
  {
    type: 'early',
    name: 'Symptoms in Community (FB)',
    longDescription: `<p>
    Each day, Delphi surveys tens of thousands of Facebook users
    and asks them if they know anyone in their local community who is sick -- with
    fever and either sore throat, cough, shortness of breath, or difficulty breathing.
    We also ask whether anyone in their household is currently experiencing COVID-like
    symptoms. We use these questions to calculate the percentage of people who know
    someone, in their household or outside it, who is sick. While many conditions can
    cause these symptoms, not just COVID, comparing the rates across the country can
    suggest where COVID is most active.
    </p>`,
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
      'Percentage of people who know someone in their local community with COVID-like symptoms, based on Facebook surveys',
    yAxis: 'Percentage',
    format: 'percent',
    hasStdErr: true,
  },
  {
    type: 'early',
    name: 'Combined',
    longDescription: `<p>
    This data represents a combination of Doctor Visits, Symptoms (Facebook),
    Symptoms in Community (Facebook), and Search Trends.  It does not include official
    reports (cases and deaths), hospital admissions, or SafeGraph signals.  We use a
    rank-1 approximation, from a nonnegative matrix factorization approach, to identify an
    underlying signal that best reconstructs the indicators.  Higher values of the
    combined signal correspond to higher values of the other indicators, but the
    scale (units) of the combination is arbitrary.
    </p>`,
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
    tooltipText: 'Combination of COVID-19 indicators available at this geographic level',
    mapTitleText: 'Combination of COVID-19 indicators',
    yAxis: 'Combined value (arbitrary scale)',
    format: 'raw',
    hasStdErr: true,
  },
  {
    type: 'public',
    name: 'Away from Home 6hr+ (SG)',
    longDescription: `<p>
    Delphi receives data from <a href="https://docs.safegraph.com/docs/social-distancing-metrics" target="_blank" rel="noopener noreferrer">SafeGraph</a>,
    which collects anonymized location data
    from mobile phones. Using this data, we calculate the fraction of mobile devices
    that spent between more than 6 hours at a location other than their home during
    the daytime, an indicator of how mobile people are or whether they are traveling
    to work or school outside their homes.<p>`,
    links: [
      {
        alt: 'Technical description',
        href: 'https://cmu-delphi.github.io/delphi-epidata/api/covidcast-signals/safegraph.html',
      },
    ],
    id: 'safegraph',
    signal: 'full_time_work_prop',
    levels: ['county', 'state'],
    mapTitleText: 'Proportion of people spending 6 hours or more away from home, based on SafeGraph mobility data',
    yAxis: 'Proportion',
    format: 'raw',
    hasStdErr: true,
  },
  {
    type: 'public',
    name: 'Away from Home 3-6hr (SG)',
    longDescription: `<p>
    Delphi receives data from <a href="https://docs.safegraph.com/docs/social-distancing-metrics" target="_blank" rel="noopener noreferrer">SafeGraph</a>,
    which collects anonymized location data from
    mobile phones. Using this data, we calculate the fraction of mobile devices that
    spent between 3 and 6 hours at a location other than their home during the daytime,
     an indicator of how mobile people are.</p>
`,
    links: [
      {
        alt: 'Technical description',
        href: 'https://cmu-delphi.github.io/delphi-epidata/api/covidcast-signals/safegraph.html',
      },
    ],
    id: 'safegraph',
    signal: 'part_time_work_prop',
    levels: ['county', 'state'],
    mapTitleText: 'Proportion of people spending 3-6 hours away from home, based on SafeGraph mobility data',
    yAxis: 'Proportion',
    format: 'raw',
    hasStdErr: true,
  },
  {
    type: 'public',
    name: 'Search Trends (Google)',
    longDescription: `<p>Delphi receives outpatient doctor visits data from our health system partners.
    Using this data, which is de-identified, Delphi estimates the percentage of daily doctor’s visits in each area
     that are related to COVID. Note that this can only report on regions and patients whose data is observed by our partners.</p>`,
    links: [
      {
        alt: 'Technical description',
        href: 'https://cmu-delphi.github.io/delphi-epidata/api/covidcast-signals/ght.html',
      },
    ],
    id: 'ght',
    signal: 'smoothed_search',
    levels: ['msa', 'state', 'hrr', 'dma'],
    mapTitleText: 'Relative frequency of COVID-related Google searches',
    yAxis: 'Frequency (arbitrary scale)',
    format: 'raw',
    hasStdErr: false,
  },
  {
    type: 'late',
    name: 'COVID-19 Antigen Tests (Quidel)',
    longDescription: `<p>
    Quidel, a national provider of networked lab testing devices,
    provides us with data about all COVID antigen tests they conduct.
    When a patient (whether at a doctor’s office, clinic, or hospital)
    has COVID-like symptoms, doctors may order an antigen test, which can
    detect parts of the virus that are present during an active infection.
    We report the percentage of COVID antigen tests that are positive. Note
    that this only reports on Quidel’s antigen tests, not on tests conducted
    by other providers.
    </p>`,
    links: [
      {
        alt: 'Technical description',
        href: 'https://cmu-delphi.github.io/delphi-epidata/api/covidcast-signals/quidel.html#covid-19-tests',
      },
    ],
    id: 'quidel',
    signal: 'covid_ag_smoothed_pct_positive',
    levels: ['state', 'msa', 'hrr'],
    tooltipText: 'Daily test positivity rate for COVID-19 antigens, based on data provided by Quidel, Inc.',
    mapTitleText: 'Daily test positivity rate for COVID-19 antigens',
    yAxis: 'Percentage',
    format: 'percent',
    hasStdErr: true,
  },
  {
    type: 'late',
    name: 'Hospital Admissions',
    longDescription: `<p>
    Delphi receives de-identified electronic medical records and claims data
    from our health systems partners. Based on diagnostic codes, we calculate
    the percentage of new hospital admissions each day that are related to COVID-19.
    Note that this can only report on regions and patients whose data is observed
    by our partners, and reflects new hospital admissions each day, rather than the
    fraction of all currently hospitalized patients who have COVID-related diagnoses.
    </p>`,
    links: [
      {
        alt: 'Technical description',
        href: 'https://cmu-delphi.github.io/delphi-epidata/api/covidcast-signals/hospital-admissions.html',
      },
    ],
    id: 'hospital-admissions',
    signal: 'smoothed_adj_covid19',
    levels: ['county', 'msa', 'state'],
    mapTitleText: 'Percentage of daily hospital admissions with COVID-19 associated diagnoses',
    yAxis: 'Percentage',
    format: 'percent',
    hasStdErr: false,
  },
  {
    type: 'late',
    name: 'Cases',
    longDescription: `<p>
    This data shows the number of new confirmed COVID-19 cases per day.
    The maps reflect only cases confirmed by state and local health authorities.
    They are based on confirmed case counts compiled and made public by
    <a href="https://systems.jhu.edu/research/public-health/ncov/" target="_blank" rel="noopener noreferrer">
    a team at Johns Hopkins University</a> and by
    <a href="https://usafacts.org/visualizations/coronavirus-covid-19-spread-map/" target="_blank" rel="noopener noreferrer">USAFacts</a>.
    We use Johns Hopkins data for Puerto Rico and report USAFacts data in
    all other locations.
    </p>`,
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
    hasStdErr: false,
  },
  {
    type: 'late',
    name: 'Deaths',
    longDescription: `<p>
    This data shows the number of COVID-19 related deaths per day.
    The maps reflect official figures by state and local health authorities,
    and may not include excess deaths not confirmed as due to COVID-19 by
    health authorities. They are based on confirmed death counts compiled
    and made public by <a href="https://systems.jhu.edu/research/public-health/ncov/" target="_blank" rel="noopener noreferrer">
    a team at Johns Hopkins University</a> and by
    <a href="https://usafacts.org/visualizations/coronavirus-covid-19-spread-map/" target="_blank" rel="noopener noreferrer">USAFacts</a>.
    We use Johns Hopkins data for Puerto Rico and report USAFacts data in all
    other locations.
    </p>`,
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
