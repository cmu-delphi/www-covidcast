import { dsvFormat } from 'd3-dsv';
import stateRaw from './processed/state.csv.js';
import msaRaw from './processed/msa.csv.js';
import countyRaw from './processed/county.csv.js';
import hrrRaw from './processed/hrr.csv.js';
import hhsRaw from './processed/hhs.csv.js';

export const levelMegaCountyId = 'mega-county';
/**
 * @typedef {object} NameInfo
 * @property {string} name name for param
 * @property {string} displayName name to show and search
 * @property {string} id param id
 * @property {string} propertyId geojson: feature.property.id
 * @property {number} population
 * @property {string?} region just for state and county
 * @property {string?} state just for county
 * @property {'state' | 'county' | 'msa' | 'hrr' | 'nation' | 'hhs'} level
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

const stateClasses = {
  West: ['WY', 'ID', 'MT', 'UT', 'AK', 'NM', 'CO', 'NV', 'AZ', 'OR', 'WA', 'CA', 'HI'],
  Midwest: ['SD', 'ND', 'IA', 'NE', 'MO', 'WI', 'KS', 'MN', 'IL', 'OH', 'MI', 'IN'],
  Northeast: ['PA', 'ME', 'NH', 'NJ', 'NY', 'VT', 'MA', 'RI', 'CT', 'DE'],
  South: ['OK', 'TN', 'AL', 'WV', 'AR', 'KY', 'TX', 'GA', 'SC', 'NC', 'LA', 'FL', 'VA', 'MD', 'DC', 'PR', 'MS'],
};

Object.entries(stateClasses).forEach(([key, value]) => {
  for (const v of value) {
    stateLookup.get(v.toLowerCase()).region = key;
  }
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
    const state = stateLookup.get(county.id.slice(0, 2));
    county.state = state.postal;
    county.region = state.region;
  },
);
export const hrrInfo = parseCSV(hrrRaw, 'hrr', (hrr) => `${hrr.state} - ${hrr.name} (HRR)`);
export const hhsInfo = parseCSV(
  hhsRaw,
  'hhs',
  (hhs) => `HHS Region ${hhs.id.length < 2 ? ' ' : ''}${hhs.id} ${hhs.name}`,
  (hhs) => {
    hhs.states = hhs.states.split(',');
  },
);

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
  region: info.region,
  state: info.id,
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
  hhs: hhsInfo.sort(sortByDisplayName),
  [levelMegaCountyId]: megaCountyInfo.sort(sortByDisplayName),
};

export const nameInfos = stateInfo
  .concat(msaInfo, countyInfo, hrrInfo, megaCountyInfo, hhsInfo)
  .sort(sortByDisplayName);

/**
 * helper to resolve a given id to a name info object
 * @type {Map<string, NameInfo>}
 */
const infoLookup = new Map();
function addInfo(d) {
  const levelPrefix = d.level + ':';
  const id = String(d.propertyId).toLowerCase();
  if (!infoLookup.has(id)) {
    infoLookup.set(id, d);
  }
  if (!infoLookup.has(levelPrefix + id)) {
    infoLookup.set(levelPrefix + id, d);
  }
  const key = String(d.id).toLowerCase();
  if (!infoLookup.has(key)) {
    infoLookup.set(key, d);
  }
  if (!infoLookup.has(levelPrefix + key)) {
    infoLookup.set(levelPrefix + key, d);
  }
}
nameInfos.forEach(addInfo);
addInfo(nationInfo);

for (const alias of [
  ['02270', '02158'],
  ['46113', '46102'],
]) {
  infoLookup.set(alias[0], getInfoByName(alias[1]));
}

export function getInfoByName(name, level = null) {
  if (!name) {
    return null;
  }
  const key = (level != null ? `${level}:` : '') + String(name).toLowerCase();
  const r = infoLookup.get(key);
  if (!r) {
    console.warn('unknown', name, level);
  }
  return r;
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
/**
 * returns the state of a county
 * @param {NameInfo} county
 */
export function getStateOfCounty(county) {
  return getInfoByName(county.state);
}

/**
 * returns the states of a HHS Region
 * @param {NameInfo} hhs
 * @returns {NameInfo[]}
 */
export function getStatesOfHHS(hhs) {
  if (hhs.level !== 'hhs') {
    return [];
  }
  return hhs.states.map((d) => getInfoByName(d, 'state'));
}
