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
 * @property {number?} area
 * @property {number} lat center latitude
 * @property {number} long center longitude
 * @property {'state' | 'county' | 'msa' | 'hrr' | 'nation'} level
 */

function parseCSV(csv, level, deriveDisplayName = (d) => d.name) {
  /**
   * @type {NameInfo[]}
   */
  const r = dsvFormat(',').parse(csv, (d) => {
    Object.assign(d, {
      level,
      propertyId: d.postal || d.id,
      population: d.population === 'NaN' || d.population === '' ? null : Number.parseInt(d.population, 10),
      area: d.area === 'NaN' || d.area === '' ? null : Number.parseFloat(d.area),
      lat: Number.parseFloat(d.lat),
      long: Number.parseFloat(d.long),
    });
    if (!d.displayName) {
      d.displayName = deriveDisplayName(d);
    }
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
  displayName: 'US - Whole Nation',
  propertyId: 'us',
  long: stateInfo.find((d) => d.propertyId === 'DC').long,
  lat: stateInfo.find((d) => d.propertyId === 'DC').lat,
  area: stateInfo.reduce((acc, v) => acc + v.area, 0),
  population: stateInfo.reduce((acc, v) => acc + v.population, 0),
};

export const msaInfo = parseCSV(msaRaw, 'msa');
export const countyInfo = parseCSV(countyRaw, 'county', (county) => `${county.name} County, ${county.state}`);
export const hrrInfo = parseCSV(hrrRaw, 'hrr', (hrr) => `${hrr.state} - ${hrr.name} (HRR)`);

// generate mega counties by copying the states
const megaCountyInfo = stateInfo.map((info) => ({
  id: info.id + '000',
  propertyId: info.id + '000',
  name: `Rest of ${info.name}`,
  displayName: `Rest of ${info.displayName}`,
  population: null,
  level: levelMegaCountyId,
  lat: null,
  long: null,
}));

export const nameInfos = stateInfo
  .concat(msaInfo, countyInfo, hrrInfo, megaCountyInfo)
  .sort((a, b) => a.displayName.localeCompare(b.displayName));

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
