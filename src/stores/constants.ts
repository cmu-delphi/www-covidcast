import { isCasesSignal, isDeathSignal, isPropSignal, isCountSignal } from '../data/signals';
import { formatAPITime } from '../data/utils';
import descriptions from './descriptions.generated.json';
import { modeByID } from '../modes';
import { formatRawValue, formatValue, formatPercentage } from '../formats';
import { interpolateYlGnBu, interpolateYlOrRd } from 'd3-scale-chromatic';
import { getDataSource } from './dataSourceLookup';
import type { RegionLevel } from '../maps/interfaces';
// import { generateMockSignal, generateMockMeta } from '../data/mock';

export interface LevelInfo {
  id: RegionLevel;
  label: string;
  labelPlural: string;
}

export const levelList: LevelInfo[] = [
  {
    id: 'nation',
    label: 'United States',
    labelPlural: 'United States',
  },
  {
    id: 'hhs',
    label: 'Dep. of Health & Human Services Regions',
    labelPlural: 'Dep. of Health & Human Services Regions',
  },
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
export const levels: RegionLevel[] = levelList.map((l) => l.id);

export const levelMegaCounty: LevelInfo = {
  id: 'mega-county',
  label: 'Mega County',
  labelPlural: 'Mega Counties',
};
export const levelsWithMega = levels.concat(levelMegaCounty.id);

const levelById = new Map<string, LevelInfo>(levelList.map((l) => [l.id, l]));

export function getLevelInfo(level: string): LevelInfo {
  return (
    levelById.get(level) || {
      id: level as RegionLevel,
      label: level.toUpperCase(),
      labelPlural: level.toUpperCase(),
    }
  );
}

export interface CasesOrDeathOptions {
  cumulative: boolean;
  incidence: boolean;
}

export interface Sensor {
  readonly key: string; // id:signal
  readonly id: string; // data source
  readonly signal: string;
  readonly rawSignal?: string; // raw signal in case of a 7day average
  readonly rawSensor?: Sensor; // raw signal in case of a 7day average

  readonly name: string; // signal name
  readonly unit: string;
  readonly dataSourceName: string;
  readonly type: 'public' | 'early' | 'late';
  readonly levels: readonly RegionLevel[];
  readonly description?: string; // HTML long text description
  readonly signalTooltip: string; // short text description
  readonly colorScale: (this: void, v: number) => string;

  readonly links: readonly string[]; // more information links
  readonly credits?: string; // credit text

  readonly format: 'raw' | 'per100k' | 'percent' | 'fraction';
  readonly xAxis: string; // x axis title
  readonly yAxis: string; // y axis value unit long
  readonly isInverted: boolean;
  readonly is7DayAverage: boolean;
  readonly hasStdErr: boolean;
  formatValue(v: number, enforceSign?: boolean): string;

  readonly highlight?: string[];
}

export function ensureSensorStructure(
  sensor: Partial<Sensor> & { id: string; signal: string; tooltipText?: unknown },
): Sensor {
  const key = `${sensor.id}-${sensor.signal}`;

  const isInverted = sensor.isInverted || false;
  const format = sensor.format || 'raw';

  const formatter = {
    raw: formatRawValue,
    fraction: formatRawValue,
    percent: formatPercentage,
    per100k: formatValue,
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
  const rawSignal = sensor.rawSignal === 'null' || sensor.rawSignal === sensor.signal ? null : sensor.rawSignal;

  const full = Object.assign(sensor, {
    key,
    type: 'public',
    dataSourceName: getDataSource(sensor),
    levels: ['state'],
    description: sensor.signalTooltip || 'No description available',
    signalTooltip: typeof sensor.tooltipText === 'string' ? sensor.tooltipText : 'No description available',
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

  if (rawSignal) {
    // create a raw version
    Object.assign(full, {
      rawSensor: {
        ...full,
        key: `${sensor.id}-${rawSignal}`,
        name: `${full.name!.replace('(7-day average)', '')} (Raw)`,
        description: full.description.replace('(7-day average)', ''),
        signal: rawSignal,
        is7DayAverage: false,
        rawSensor: null,
        rawSignal: null,
      },
    });
  }

  return full as Sensor;
}

export interface EpiDataCasesOrDeathValues {
  avg: number;
  count: number;
  countCumulative: number;
  avgRatio: number;
  countRatio: number;
  countRatioCumulative: number;
}

export const EPIDATA_CASES_OR_DEATH_VALUES: (keyof EpiDataCasesOrDeathValues)[] = [
  'avg',
  'count',
  'countCumulative',
  'avgRatio',
  'countRatio',
  'countRatioCumulative',
];

export interface RegularOldSensor {
  isCasesOrDeath: false;
  isCount: boolean; // is count signal
  getType(options?: CasesOrDeathOptions): 'prop' | 'count' | 'other';
  default?: boolean; // whether it should be default signal
  tooltipText: string | ((options?: CasesOrDeathOptions) => string);
  mapTitleText: string | ((options?: CasesOrDeathOptions) => string);
  plotTitleText: string;
}

export interface CasesOrDeathOldSensor {
  isCasesOrDeath: true;
  isCount: boolean; // is count signal
  getType(options?: CasesOrDeathOptions): 'prop' | 'count' | 'other';
  default?: boolean; // whether it should be default signal
  casesOrDeathSignals: Record<keyof EpiDataCasesOrDeathValues, string>;
  casesOrDeathSensors: Record<keyof EpiDataCasesOrDeathValues, Sensor>;
  tooltipText: (options?: CasesOrDeathOptions) => string;
  mapTitleText: (options?: CasesOrDeathOptions) => string;
  plotTitleText: string;
}

export declare type SensorEntry = Sensor & (RegularOldSensor | CasesOrDeathOldSensor);

/**
 * determines the primary value to show or lookup
 */
export function primaryValue(
  sensorEntry: { isCasesOrDeath?: boolean },
  sensorOptions: Partial<CasesOrDeathOptions> = {},
): 'value' | keyof EpiDataCasesOrDeathValues {
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
 */
export function getType(
  sensorEntry: {
    signal: string;
    isCasesOrDeath?: boolean;
    casesOrDeathSignals?: Record<keyof EpiDataCasesOrDeathValues, string>;
  },
  sensorOptions: Partial<CasesOrDeathOptions> = {},
): 'prop' | 'count' | 'other' {
  let signal = sensorEntry.signal;
  if (sensorEntry.isCasesOrDeath) {
    const valueKey = primaryValue(sensorEntry, sensorOptions) as keyof EpiDataCasesOrDeathValues;
    signal = sensorEntry.casesOrDeathSignals?.[valueKey] ?? sensorEntry.signal;
  }
  if (isCountSignal(signal)) {
    return 'count';
  }
  if (isPropSignal(signal)) {
    return 'prop';
  }
  return 'other';
}

export function extendSensorEntry(sensorEntry: Partial<SensorEntry> & { id: string; signal: string }): SensorEntry {
  const key = `${sensorEntry.id}-${sensorEntry.signal}`;
  const isCasesOrDeath = isCasesSignal(key) || isDeathSignal(key);
  const isCount = isCountSignal(key);

  const mapTitle = (sensorEntry.mapTitleText as unknown) as {
    incidenceCumulative: string;
    ratioCumulative: string;
    incidence: string;
    ratio: string;
  };

  const full: Sensor & RegularOldSensor = Object.assign(ensureSensorStructure(sensorEntry), {
    key,
    tooltipText: sensorEntry.tooltipText || ((mapTitle as unknown) as string),
    isCount,
    getType: (options: CasesOrDeathOptions) => getType(sensorEntry, options),
    isCasesOrDeath: false as const,
    plotTitleText: sensorEntry.plotTitleText || sensorEntry.name!,
    mapTitleText: sensorEntry.mapTitleText!,
  });
  if (!isCasesOrDeath) {
    return full;
  }
  const casesOrDeath = (full as unknown) as Sensor & CasesOrDeathOldSensor;
  casesOrDeath.isCasesOrDeath = true;
  casesOrDeath.casesOrDeathSensors = {} as CasesOrDeathOldSensor['casesOrDeathSensors'];
  casesOrDeath.mapTitleText =
    typeof mapTitle === 'function'
      ? (mapTitle as (options?: CasesOrDeathOptions) => string)
      : (options?: CasesOrDeathOptions) => {
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
        };

  const add = (cumulative: boolean, ratio: boolean) => {
    const options = { cumulative, incidence: !ratio };
    const subKey = primaryValue(full, options) as keyof EpiDataCasesOrDeathValues;
    const signal = casesOrDeath.casesOrDeathSignals[subKey];
    const name = `${cumulative ? 'Cumulative ' : ''}${full.name}${ratio ? ' (per 100,000 people)' : ''}`;
    casesOrDeath.casesOrDeathSensors[subKey] = ensureSensorStructure({
      name: `${name} ${!cumulative ? '(7-day average)' : ''}`,
      id: full.id,
      signal,
      type: full.type,
      levels: full.levels,
      xAxis: full.xAxis,
      format: ratio ? 'per100k' : 'raw',
      unit: ratio ? 'per 100,000 people' : 'people',
      isInverted: false,
      is7DayAverage: true,
      hasStdErr: full.hasStdErr,
      signalTooltip: casesOrDeath.mapTitleText(options),
      description: full.description,
      links: full.links,
      credits: full.credits,
    });
  };
  add(false, false);
  add(false, true);
  add(true, false);
  return casesOrDeath;
}

/**
 * defines the geo types / levels that are should be used for computing the meta data, the first one has the highest priority and so on
 */
export const regularSignalMetaDataGeoTypeCandidates = ['county', 'msa'];

const defaultSensors = (descriptions as unknown) as (Partial<SensorEntry> & { id: string; signal: string })[];

/**
 * @type {SensorEntry[]}
 */
export const sensorList: SensorEntry[] = (() => {
  const queryString = window.location.search;
  const urlParams = new URLSearchParams(queryString);
  const sensorsOption = urlParams.get('sensors');
  if (sensorsOption) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (JSON.parse(decodeURIComponent(sensorsOption)) as any[]).map((d) => extendSensorEntry(d));
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
export const DEFAULT_SENSOR = (sensorList.find((d) => d.highlight && d.highlight.includes('default')) || sensorList[0])
  .key;

/**
 * default sensor in case the initial mode is survey-results
 */

export const DEFAULT_SURVEY_SENSOR = (() => {
  const highlightBased = sensorList.find((d) => d.highlight && d.highlight.includes('survey'));
  if (highlightBased) {
    return highlightBased.key;
  }
  const cli = sensorList.find((d) => d.id === 'fb-survey' && d.signal.includes('cli'));
  if (cli) {
    return cli.key;
  }
  return DEFAULT_SENSOR;
})();
export const DEFAULT_CORRELATION_SENSOR = (() => {
  const highlightBased = sensorList.find((d) => d.highlight && d.highlight.includes('correlation'));
  if (highlightBased) {
    return highlightBased.key;
  }
  const cases = sensorList.find((d) => d.isCasesOrDeath);
  if (cases) {
    return cases.key;
  }
  return DEFAULT_SURVEY_SENSOR;
})();
export const DEFAULT_LEVEL = 'county' as RegionLevel;
export const DEFAULT_ENCODING = 'color' as 'color' | 'spike' | 'bubble';
