import { isCasesSignal, isDeathSignal, isPropSignal, isCountSignal } from '../data/signals';
import { formatAPITime } from '../data/utils';
import { format } from 'd3-format';
import descriptions from './descriptions.generated.json';
import '!file-loader?name=descriptions.raw.txt!./descriptions.raw.txt';
import { resolveColorScale } from './colorScales';
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
 * @property {string?} description
 * @property {string[]} links
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

  const mapTitle = sensorEntry.mapTitleText;

  return Object.assign(sensorEntry, {
    key,
    tooltipText: sensorEntry.tooltipText || mapTitle,
    formatValue: sensorEntry.format === 'percent' ? percentFormatter : isCount ? countFormatter : rawFormatter,
    isCount,
    getType: (options) => getType(sensorEntry, options),
    isCasesOrDeath,
    colorScale: resolveColorScale(sensorEntry.colorScale),
    links: sensorEntry.links || [],
    mapTitleText:
      typeof mapTitle === 'string'
        ? mapTitle
        : (options) => {
            // generate lookup function
            if (!options) {
              return mapTitle.incidence;
            }
            if (options.cumulative) {
              if (options.ratio) {
                return mapTitle.ratioCumulative;
              } else {
                return mapTitle.incidenceCumulative;
              }
            } else if (options.ratio) {
              return mapTitle.ratio;
            } else {
              return mapTitle.incidence;
            }
          },
  });
}

export const defaultSensorId = 'doctor-visits';

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
