import { dsvFormat } from 'd3-dsv';
import stateRaw from './processed/state.csv.js';
import msaRaw from './processed/msa.csv.js';
import countyRaw from './processed/county.csv.js';
import hrrRaw from './processed/hrr.csv.js';

export const levelMegaCountyId = 'mega-county';
/**
 * @typedef {object} NameInfo
 * @property {string} name name for param
 * @property {string} displayName name to show and search
 * @property {string} id param id
 * @property {string} propertyId geojson: feature.property.id
 * @property {number} population
 * @property {'state' | 'county' | 'msa' | 'hrr' | 'nation'} level
 */

function parseCSV(csv, level, deriveDisplayName = (d) => d.name, extras = () => undefined) {
  /**
   * @type {NameInfo[]}
   */
  const r = dsvFormat(';').parse(csv, (d) => {
    Object.assign(d, {
      level,
      propertyId: d.postal || d.id,
      population: d.population === 'NaN' || d.population === '' ? null : Number.parseInt(d.population, 10),
    });
    if (!d.displayName || d.displayName === 'X') {
      d.displayName = deriveDisplayName(d);
    }
    extras(d);
    return d;
  });
  return r;
}

export const stateInfo = parseCSV(stateRaw, 'state');
const stateLookup = new Map();
stateInfo.forEach((state) => {
  stateLookup.set(state.id.toLowerCase(), state);
  stateLookup.set(state.propertyId.toLowerCase(), state);
});

/**
 * @type {NameInfo}
 */
export const nationInfo = {
  level: 'nation',
  name: 'US',
  id: 'us',
  displayName: 'United States',
  propertyId: 'us',
  population: stateInfo.reduce((acc, v) => acc + v.population, 0),
};

export const msaInfo = parseCSV(msaRaw, 'msa');
export const countyInfo = parseCSV(
  countyRaw,
  'county',
  (county) =>
    `${county.name}${county.displayName !== 'X' ? ' County' : ''}, ${stateLookup.get(county.id.slice(0, 2)).postal}`,
  (county) => {
    county.state = stateLookup.get(county.id.slice(0, 2)).postal;
  },
);
export const hrrInfo = parseCSV(hrrRaw, 'hrr', (hrr) => `${hrr.state} - ${hrr.name} (HRR)`);

// generate mega counties by copying the states
/**
 * @type {NameInfo[]}
 */
export const megaCountyInfo = stateInfo.map((info) => ({
  id: info.id + '000',
  propertyId: info.id + '000',
  name: `Rest of ${info.name}`,
  displayName: `Rest of ${info.displayName}`,
  population: null,
  level: levelMegaCountyId,
  lat: null,
  long: null,
}));

function sortByDisplayName(a, b) {
  return a.displayName.localeCompare(b.displayName);
}

export const infosByLevel = {
  nation: [nationInfo],
  state: stateInfo.sort(sortByDisplayName),
  msa: msaInfo.sort(sortByDisplayName),
  county: countyInfo.sort(sortByDisplayName),
  hrr: hrrInfo.sort(sortByDisplayName),
  [levelMegaCountyId]: megaCountyInfo.sort(sortByDisplayName),
};

export const nameInfos = stateInfo.concat(msaInfo, countyInfo, hrrInfo, megaCountyInfo).sort(sortByDisplayName);

/**
 * helper to resolve a given id to a name info object
 * @type {Map<string, NameInfo>}
 */
const infoLookup = new Map();
nameInfos.forEach((d) => {
  const id = String(d.propertyId).toLowerCase();
  if (!infoLookup.has(id)) {
    infoLookup.set(id, d);
  }
  const key = String(d.id).toLowerCase();
  if (!infoLookup.has(key)) {
    infoLookup.set(key, d);
  }
});

export function getInfoByName(name) {
  return infoLookup.get(String(name).toLowerCase());
}

/**
 * computes the population of the mega county as state - defined county populations
 * @param {NameInfo} megaCounty
 * @param {Map<string, any>} data
 */
export function computeMegaCountyPopulation(megaCounty, data) {
  if (!megaCounty || !data || megaCounty.level !== levelMegaCountyId) {
    return null;
  }
  const state = getInfoByName(megaCounty.postal);
  if (!state || state.population == null || Number.isNaN(state.population)) {
    return null;
  }
  const population = Array.from(data.keys()).reduce((population, fips) => {
    // not in the state or the mega county
    if (!fips.startsWith(state.id) || fips === megaCounty.id) {
      return population;
    }
    const county = getInfoByName(fips);
    if (!county || county.population == null || Number.isNaN(county.population)) {
      // invalid county, so we cannot compute the rest population, keep NaN from now on
      return Number.NaN;
    }
    return population - county.population;
  }, state.population);

  return Number.isNaN(population) ? null : population;
}

/**
 * returns the counties of a state
 * @param {NameInfo} state
 */
export function getCountiesOfState(state) {
  return countyInfo.filter((d) => d.id.slice(0, 2) === state.id);
}
