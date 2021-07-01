import descriptions from './descriptions.generated.json';
import { modeByID } from '../modes';
import { ensureSensorStructure, Sensor, sensorTypes } from '../data/sensor';

export * from '../data/geoLevel';
export type { Sensor } from '../data/sensor';

interface CompatibilitySensor extends Partial<Sensor> {
  name: string;
  id: string;
  signal: string;
  mapTitleText:
    | string
    | {
        incidenceCumulative: string;
        ratioCumulative: string;
        incidence: string;
        ratio: string;
      };
  casesOrDeathSignals?: {
    countRatioCumulative: string;
  };
  tooltipText?: string;
}

export function extendSensorCompatibility(sensorEntry: CompatibilitySensor): Sensor {
  const baseHelp = sensorEntry.tooltipText || sensorEntry.mapTitleText;
  Object.assign(sensorEntry, {
    signalTooltip: typeof baseHelp === 'string' ? baseHelp : baseHelp.ratio,
    rawCumulativeSignal: sensorEntry.casesOrDeathSignals?.countRatioCumulative,
  });
  return ensureSensorStructure(sensorEntry);
}

export const sensorList = (descriptions as unknown as CompatibilitySensor[]).map(extendSensorCompatibility);

export const sensorMap = new Map(sensorList.map((s) => [s.key, s]));

export function resolveSensorWithAliases(sensor: string | undefined | null, defaultValue: string): string {
  if (sensor && sensorMap.has(sensor)) {
    return sensor;
  }
  if (!sensor) {
    return defaultValue;
  }
  // check for aliases
  for (const s of sensorList) {
    if (s.linkFrom && s.linkFrom.includes(sensor)) {
      return s.key;
    }
  }
  return defaultValue;
}

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

export function findCasesSensor(): Sensor {
  return sensorList.find((d) => d.signal === 'confirmed_7dav_incidence_prop')!;
}

export function findDeathsSensor(): Sensor {
  return sensorList.find((d) => d.signal === 'deaths_7dav_incidence_prop')!;
}

export const DEFAULT_CORRELATION_SENSOR = (() => {
  const highlightBased = sensorList.find((d) => d.highlight && d.highlight.includes('correlation'));
  if (highlightBased) {
    return highlightBased.key;
  }
  const cases = findCasesSensor();
  if (cases) {
    return cases.key;
  }
  return DEFAULT_SURVEY_SENSOR;
})();
