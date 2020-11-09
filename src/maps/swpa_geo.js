import stateTopoJSON from './processed/swpa/state.topojson.js';
import countyTopoJSON from './processed/swpa/county.topojson.js';
import msaTopoJSON from './processed/swpa/msa.topojson.js';
import neighborhoodTopoJSON from './processed/swpa/neighborhood.topojson.js';
import zipTopoJSON from './processed/swpa/zip.topojson.js';
import hrrTopoJSON from './processed/swpa/hrr.topojson.js';
import { generateGeo } from './utils';
import { feature } from 'topojson-client';

/**
 * loads all geo json sources
 * @param {import('.').NameInfo[]} stateInfo
 * @param {import('.').NameInfo[]} countyInfo
 * @param {import('.').NameInfo[]} msaInfo
 * @param {import('.').NameInfo[]} neighborhoodInfo
 * @param {import('.').NameInfo[]} zipInfo
 * @param {*} additionalProperties
 */
export default function load(stateInfo, countyInfo, msaInfo, neighborhoodInfo, zipInfo, additionalProperties = {}) {
  const state = generateGeo(stateTopoJSON, 'state', stateInfo, additionalProperties);
  const county = generateGeo(countyTopoJSON, 'county', countyInfo, additionalProperties);
  const msa = generateGeo(msaTopoJSON, 'msa', msaInfo, additionalProperties);
  const neighborhood = generateGeo(neighborhoodTopoJSON, 'neighborhood', neighborhoodInfo, additionalProperties);
  const zip = generateGeo(zipTopoJSON, 'zip', zipInfo, additionalProperties);
  return {
    hrr: feature(hrrTopoJSON, 'hrr'),
    state,
    msa,
    county,
    zip,
    neighborhood,
  };
}
