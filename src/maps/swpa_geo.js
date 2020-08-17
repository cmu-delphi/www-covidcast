import stateTopoJSON from './processed/swpa/state.geojson.json';
import countyTopoJSON from './processed/swpa/county.geojson.json';
import msaTopoJSON from './processed/swpa/msa.geojson.json';
import neighborhoodTopoJSON from './processed/swpa/neighborhood.geojson.json';
import zipTopoJSON from './processed/swpa/zip.geojson.json';
import { generateGeo } from './utils';
import { geoCentroid } from 'd3';

/**
 * loads all geo json sources
 * @param {import('.').NameInfo[]} stateInfo
 * @param {import('.').NameInfo[]} countyInfo
 * @param {import('.').NameInfo[]} msaInfo
 * @param {import('.').NameInfo[]} neighborhoodInfo
 * @param {*} additionalProperties
 */
export default function load(stateInfo, countyInfo, msaInfo, neighborhoodInfo, additionalProperties = {}) {
  const state = generateGeo(stateTopoJSON, 'state', stateInfo, additionalProperties);
  const county = generateGeo(countyTopoJSON, 'county', countyInfo, additionalProperties);
  const msa = generateGeo(msaTopoJSON, 'msa', msaInfo, additionalProperties);
  const neighborhood = generateGeo(neighborhoodTopoJSON, 'neighborhood', neighborhoodInfo, additionalProperties);
  const zip = generateGeo(
    zipTopoJSON,
    'zip',
    (feature) => {
      const center = geoCentroid(feature);
      return {
        id: feature.id,
        propertyId: feature.id,
        name: feature.id,
        displayName: feature.id,
        lat: center[0],
        long: center[1],
      };
    },
    additionalProperties,
  );
  return {
    state,
    msa,
    county,
    zip,
    neighborhood,
  };
}
