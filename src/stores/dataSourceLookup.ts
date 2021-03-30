import { isCasesSignal, isDeathSignal } from '../data/signals';
import type { Sensor } from './constants';

export const CASES_DEATH_SOURCE = 'cases-deaths';

const sourceNameLookup: Record<string, string> = {
  chng: 'Change Healthcare',
  'doctor-visits': 'Doctor Visits',
  'fb-survey': 'Delphi Pandemic Survey via Facebook',
  ght: 'Google Search Trends',
  'hospital-admissions': 'Hospital Admissions',
  [CASES_DEATH_SOURCE]: 'Public Health Reports',
  'indicator-combination': 'COVID Indicator Combination',
  quidel: 'Quidel Antigen Tests',
  safegraph: 'SafeGraph Mobility Data',
  'google-symptoms': 'Google Symptoms Searches',
};

export function getDataSource(sensor: { id: string; signal: string } | Sensor): string {
  if (typeof sensor === 'string') {
    return sourceNameLookup[sensor] || sensor;
  }
  if (isCasesSignal(sensor.signal) || isDeathSignal(sensor.signal)) {
    return sourceNameLookup[CASES_DEATH_SOURCE];
  }
  return sourceNameLookup[sensor.id] || sensor.id;
}
