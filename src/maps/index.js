import boundsInfo from './processed/bounds.json';
import { dsvFormat } from 'd3-dsv';
import stateRaw from './processed/state.csv';
import msaRaw from './processed/msa.csv';
import countyRaw from './processed/county.csv';
// import neighborhoodRaw from './processed/swpa/neighborhood.csv';
// import zipRaw from './processed/swpa/zip.csv';
// import swpaFilterInfo from './processed/swpa/filterInfo.json';
import { levelMegaCounty } from '../stores/constants';

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
 * @property {'state' | 'county' | 'msa'} level
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

// generate mega counties by copying the states
const megaCountyInfo = stateInfo.map((info) => ({
  id: info.id + '000',
  propertyId: info.id + '000',
  name: `Rest of ${info.name}`,
  displayName: `Rest of ${info.displayName}`,
  population: null,
  level: levelMegaCounty.id,
  lat: null,
  long: null,
}));

export const nameInfos = stateInfo
  .concat(msaInfo, countyInfo, megaCountyInfo)
  .sort((a, b) => a.displayName.localeCompare(b.displayName));

export const bounds = boundsInfo;

export function loadSources(additionalProperties = {}) {
  // mark to be loaded as fast as possible
  return import(/* webpackPreload: true */ './geo').then((r) =>
    r.default(stateInfo, countyInfo, msaInfo, levelMegaCounty.id, additionalProperties),
  );
}

// const swpaNeighborhoodInfo = parseCSV(neighborhoodRaw, 'neighborhood');
// const swpaStateInfo = stateInfo.filter((d) => swpaFilterInfo.state.includes(d.id));
// const swpaMsaInfo = msaInfo.filter((d) => swpaFilterInfo.msa.includes(d.id));
// const swpaCountyInfo = countyInfo.filter((d) => swpaFilterInfo.county.includes(d.id));
// const swapZipInfo = parseCSV(zipRaw, 'zip');

// export const swpaNameInfos = swpaStateInfo
//   .concat(swpaMsaInfo, swpaCountyInfo, swpaNeighborhoodInfo, swapZipInfo)
//   .sort((a, b) => a.displayName.localeCompare(b.displayName));

// export function loadSWPASources(additionalProperties = {}) {
//   // mark to be loaded as fast as possible
//   return import('./swpa_geo').then((r) =>
//     r.default(stateInfo, countyInfo, msaInfo, swpaNeighborhoodInfo, swapZipInfo, additionalProperties),
//   );
// }

/**
 * helper to resolve a given id to a name info object
 * @type {Map<string, NameInfo>}
 */
const infoLookup = new Map();
// nameInfos.concat(swpaNameInfos).forEach((d) => {
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
