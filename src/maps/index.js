import boundsInfo from './processed/bounds.js';
import { dsvFormat } from 'd3-dsv';
import stateRaw from './processed/state.csv.js';
import msaRaw from './processed/msa.csv.js';
import countyRaw from './processed/county.csv.js';
import hrrRaw from './processed/hrr.csv.js';

const levelMegaCountyId = 'mega-county';
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

function parseCSV(csv, level) {
  /**
   * @type {NameInfo[]}
   */
  const r = dsvFormat(',').parse(csv, (r) => {
    return Object.assign(r, {
      level,
      displayName: r.displayName || r.name,
      propertyId: r.postal || r.id,
      population: r.population === 'NaN' || r.population === '' ? null : Number.parseInt(r.population, 10),
      area: r.area === 'NaN' || r.area === '' ? null : Number.parseFloat(r.area),
      lat: Number.parseFloat(r.lat),
      long: Number.parseFloat(r.long),
    });
  });
  return r;
}
const stateInfo = parseCSV(stateRaw, 'state');
const msaInfo = parseCSV(msaRaw, 'msa');
const countyInfo = parseCSV(countyRaw, 'county');
const hrrInfo = parseCSV(hrrRaw, 'hrr');

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

export const nameInfos = stateInfo
  .concat(msaInfo, countyInfo, hrrInfo, megaCountyInfo)
  .sort((a, b) => a.displayName.localeCompare(b.displayName));

export const bounds = boundsInfo;

export function loadSources(additionalProperties = {}) {
  // mark to be loaded as fast as possible
  return import(/* webpackPreload: true */ './geo').then((r) =>
    r.default(stateInfo, countyInfo, msaInfo, hrrInfo, levelMegaCountyId, additionalProperties),
  );
}

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
