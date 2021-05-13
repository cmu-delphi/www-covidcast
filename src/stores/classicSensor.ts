import { isCasesSignal, isCountSignal, isDeathSignal, isPropSignal } from '../data';
import { ensureSensorStructure, Sensor } from './sensor';

export interface CasesOrDeathOptions {
  cumulative: boolean;
  incidence: boolean;
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

export function extendSensorEntry(
  sensorEntry: Partial<SensorEntry> & { name: string; id: string; signal: string },
): SensorEntry {
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
    plotTitleText: sensorEntry.plotTitleText || sensorEntry.name,
    mapTitleText: sensorEntry.mapTitleText as string,
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
      highValuesAre: 'bad',
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
