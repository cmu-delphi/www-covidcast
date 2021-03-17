import { isCasesSignal, isDeathSignal, isPropSignal, isCountSignal } from '../data/signals';
import { formatAPITime } from '../data/utils';
import descriptions from './descriptions.generated.json';
import { modeByID } from '../modes';
import { formatRawValue, formatValue, formatPercentage } from '../formats';
import { interpolateYlGnBu, interpolateYlOrRd } from 'd3-scale-chromatic';
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
    id: 'hrr',
    label: 'Hospital Referral Region',
    labelPlural: 'Hospital Referral Regions',
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
      id: level,
      label: level.toUpperCase(),
      labelPlural: level.toUpperCase(),
    }
  );
}

/**
 * @typedef {object} CasesOrDeathOptions
 * @property {boolean} cumulative
 * @property {boolean} incidence
 */

/**
 * @typedef {object} Sensor
 * @property {string} key id:signal
 * @property {string} id data source
 * @property {string} signal signal
 * @property {string=} rawSignal raw signal in case of a 7day average
 * 
 * @property {string} name signal name
 * @property {'public' | 'early' | 'late'} type
 * @property {('msa' | 'state' | 'county' | 'hrr' | 'nation' | 'hss')[]} levels levels for which this signal is available
 * @property {string?} description HTML long text description
 * @property {string} signalTooltip short text description
 * @property {(v: number) => string)} colorScale
 * 
 * @property {string[]} links more information links
 * @property {string} credits credit text
 * 
 * @property {'raw' | 'per100k' | 'percent' | 'fraction'} format
 * @property {string} xAxis x axis date title
 * @property {string} yAxis y axis value title
 * @property {string} unit y axis value unit long
 * @property {boolean} isInverted
 * @property {boolean} is7DayAverage
 * @property {boolean} hasStdErr
 * @property {(v: number, enforceSign?: boolean) => string} formatValue
 */

/**
 * @param {Partial<Sensor>} sensor 
 * @returns {Sensor}
 */
export function ensureSensorStructure(sensor) {
  const key = `${sensor.id}-${sensor.signal}`;
  
  const isInverted = sensor.isInverted || false;
  const format = sensor.format || 'raw';

  const formatter = {
    raw: formatRawValue,
    fraction: formatRawValue,
    percent: formatPercentage,
    per100k: formatValue
  };
  const yAxis = {
    raw: 'arbitrary scale',
    percent: 'Percentage',
    per100k: 'per 100,000 people',
    fraction: 'Fraction of population',
  };
  const unit = {
    raw: 'arbitrary scale',
    percent: 'per 100 people',
    per100k: 'per 100,000 people',
    fraction: 'Fraction of population',
  };
  const rawSignal = sensor.rawSignal === 'null' ? null : sensor.rawSignal;

  return Object.assign(sensor, {
    key,
    type: 'public',
    levels: ['state'],
    description: 'No description available',
    signalTooltip: sensor.tooltipText || 'No description available',
    colorScale: isInverted ? interpolateYlGnBu : interpolateYlOrRd,

    links: [],
    credits: 'We are happy for you to use this data in products and publications.',

    format,
    xAxis: 'Date',
    yAxis: yAxis[format] || yAxis.raw,
    unit: unit[format] || unit.raw,
    isInverted,
    is7DayAverage: false,
    hasStdErr: false,
    formatValue: formatter[format] || formatter.raw,

    // keep the original values
    ...sensor,
    rawSignal,
  });
}

/**
 * @typedef {object} OldSensor
 * @property {boolean} isCasesOrDeath is cases or death signal
 * @property {boolean} isCount is count signal
 * @property {(options?: CasesOrDeathOptions) => 'prop' | 'count' | 'other')} getType
 * @property {Record<keyof EpiDataCasesOrDeathValues, string>} casesOrDeathSignals signal to load for cases or death
 * 
 * @property {boolean?} default whether it should be default signal
 * @property {string | ((options?: CasesOrDeathOptions) => string)} tooltipText
 * @property {string | ((options?: CasesOrDeathOptions) => string)} mapTitleText
 * @property {string} plotTitleText
 */
/**
 * @typedef {Sensor & OldSensor} SensorEntry
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
    return sensorOptions.incidence ? 'countCumulative' : 'countRatioCumulative';
  }
  return sensorOptions.incidence ? 'avg' : 'avgRatio';
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

  const mapTitle = sensorEntry.mapTitleText;

  return Object.assign(ensureSensorStructure(sensorEntry), {
    key,
    tooltipText: sensorEntry.tooltipText || mapTitle,
    
    isCount,
    getType: (options) => getType(sensorEntry, options),
    isCasesOrDeath,
    plotTitleText: sensorEntry.plotTitleText || sensorEntry.name,
    mapTitleText:
      typeof mapTitle === 'string'
        ? mapTitle
        : (options) => {
            // generate lookup function
            if (options && options.cumulative) {
              if (options.incidence) {
                return mapTitle.incidenceCumulative;
              } else {
                return mapTitle.ratioCumulative;
              }
            } else if (options && options.incidence) {
              return mapTitle.incidence;
            } else {
              return mapTitle.ratio;
            }
          },
  });
}

/**
 * defines the geo types / levels that are should be used for computing the meta data, the first one has the highest priority and so on
 */
export const regularSignalMetaDataGeoTypeCandidates = ['county', 'msa'];

/**
 * @type {Partial<SensorEntry>[]}
 */
const defaultSensors = descriptions;

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
  hrr: '357', // Pittsburgh
};

export const yesterdayDate = new Date(new Date().getTime() - 86400 * 1000);
export const yesterday = Number.parseInt(formatAPITime(yesterdayDate), 10);

export const DEFAULT_MODE = modeByID.landing;
export const DEFAULT_SENSOR = (sensorList.find((d) => d.default) || sensorList[0]).key;

/**
 * default sensor in case the initial mode is survey-results
 */
export const DEFAULT_SURVEY_SENSOR = (
  sensorList.find((d) => d.id === 'fb-survey' && d.signal.includes('cli')) || { key: DEFAULT_SENSOR }
).key;
export const DEFAULT_LEVEL = 'county';
export const DEFAULT_ENCODING = 'color';
