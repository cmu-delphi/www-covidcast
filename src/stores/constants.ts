import descriptions from './descriptions.generated.json';
import { modeByID } from '../modes';
import { yesterdayDate } from '../data/TimeFrame';
import { toTimeValue } from '../data/utils';
import { timeDay } from 'd3-time';
import { toKey } from '../data/sensor';

export * from '../data/geoLevel';
export type { Sensor } from '../data/sensor';

export interface SensorConfig {
  key: string;
  name: string;
  id: string;
  signal: string;
  signalTooltip: string;
  description: string;
  extendedColorScale?: boolean;

  unit?: string;
  unitShort?: string;

  noMaps?: boolean;

  readonly highlight?: string[];
  readonly linkFrom?: string[];

  ageStratifications?: { name: string; signal: string }[];
}

export const sensorConfig: SensorConfig[] = descriptions.map((d) =>
  Object.assign(d, {
    key: toKey(d.id, d.signal),
  }),
);

export function resolveSensorWithAliases(sensor: string | undefined | null, defaultValue: string): string {
  if (sensor && sensorConfig.find((d) => d.key === sensor)) {
    return sensor;
  }
  if (!sensor) {
    return defaultValue;
  }
  // check for aliases
  for (const s of sensorConfig) {
    if (s.linkFrom && s.linkFrom.includes(sensor)) {
      return s.key;
    }
  }
  return defaultValue;
}

export const defaultRegionOnStartup = {
  county: '42003', // Allegheny
  msa: '38300', // Pittsburgh
  state: 'PA', // Pennsylvania
  hrr: '357', // Pittsburgh
};

export const DEFAULT_MODE = modeByID.summary;
export const DEFAULT_SENSOR = (
  sensorConfig.find((d) => d.highlight && d.highlight.includes('default')) || sensorConfig[0]
).key;

/**
 * default sensor in case the initial mode is survey-results
 */

export const DEFAULT_SURVEY_SENSOR = (() => {
  const highlightBased = sensorConfig.find((d) => d.highlight && d.highlight.includes('survey'));
  if (highlightBased) {
    return highlightBased.key;
  }
  const cli = sensorConfig.find((d) => d.id === 'fb-survey' && d.signal.includes('cli'));
  if (cli) {
    return cli.key;
  }
  return DEFAULT_SENSOR;
})();

export const DEFAULT_DATE = toTimeValue(timeDay.offset(yesterdayDate, -1)).toString();
