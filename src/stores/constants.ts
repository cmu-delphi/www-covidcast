import descriptions from './descriptions.generated.json';
import { modeByID } from '../modes';
import type { RegionLevel } from '../data/regions';
import { sensorTypes } from '../data/sensor';
import { extendSensorEntry, SensorEntry } from '../data/classicSensor';

export * from '../data/geoLevel';
export type { Sensor } from '../data/sensor';
export * from '../data/classicSensor';

const defaultSensors = (descriptions as unknown) as (Partial<SensorEntry> & {
  name: string;
  id: string;
  signal: string;
})[];

export const sensorList = defaultSensors.map(extendSensorEntry);

export const sensorMap = new Map(sensorList.map((s) => [s.key, s]));

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
