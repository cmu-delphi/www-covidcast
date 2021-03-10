export const CASES_DEATH_SOURCE = 'cases-deaths';

const sourceNameLookup = {
  chng: 'Change Healthcare',
  'doctor-visits': 'Doctor Visits',
  'fb-survey': 'Delphi Pandemic Survey via Facebook',
  ght: 'Google Search Trends',
  'hospital-admissions': 'Hospital Admissions',
  [CASES_DEATH_SOURCE]: 'Public Health Reports',
  'indicator-combination': 'COVID Indicator Combination',
  quidel: 'Quidel Antigen Tests',
  safegraph: 'SafeGraph Mobility Data',
};

/**
 * @param {import('./constants').SensorEntry | string} dataSource
 */
export function getDataSource(sensor) {
  if (typeof sensor === 'string') {
    return sourceNameLookup[sensor] || sensor;
  }
  if (sensor.isCasesOrDeath) {
    return sourceNameLookup[CASES_DEATH_SOURCE];
  }
  return sourceNameLookup[sensor.id] || sensor.id;
}
