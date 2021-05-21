import { isCasesSignal, isDeathSignal } from './signals';
import type { Sensor } from './sensor';

export const CASES_SOURCE = 'cases';
export const DEATH_SOURCE = 'deaths';

const sourceNameLookup: Record<string, string> = {
  chng: 'Change Healthcare',
  'doctor-visits': 'Doctor Visits',
  'fb-survey': 'Delphi Pandemic Survey via Facebook',
  ght: 'Google Search Trends',
  'hospital-admissions': 'Hospital Admissions',
  [CASES_SOURCE]: 'COVID Cases',
  [DEATH_SOURCE]: 'COVID Deaths',
  'indicator-combination': 'COVID Indicator Combination',
  quidel: 'Quidel Antigen Tests',
  safegraph: 'SafeGraph Mobility Data',
  'google-symptoms': 'Google Symptoms Searches',
  'google-survey': 'Google Survey',
  'usa-facts': 'USAFacts',
  'jhu-csse': 'Johns Hopkins University',
  'covid-act-now': 'Covid Act Now',
};

export function getDataSource(sensor: { id: string; signal: string } | Sensor): string {
  if (typeof sensor === 'string') {
    return sourceNameLookup[sensor] || sensor;
  }
  if (isCasesSignal(sensor.signal)) {
    return sourceNameLookup[CASES_SOURCE];
  }
  if (isDeathSignal(sensor.signal)) {
    return sourceNameLookup[DEATH_SOURCE];
  }
  return sourceNameLookup[sensor.id] || sensor.id;
}