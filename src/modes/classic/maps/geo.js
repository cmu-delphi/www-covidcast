import { dsvFormat } from 'd3-dsv';
import stateTopoJSON from './processed/state.topojson.json';
import countyTopoJSON from './processed/county.topojson.json';
import msaTopoJSON from './processed/msa.topojson.json';
import hrrTopoJSON from './processed/hrr.topojson.json';
import hhsTopoJSON from './processed/hhs.topojson.json';
import nationTopoJSON from './processed/nation.topojson.json';
import citiesRaw from './processed/cities.csv.js';
import { generateGeo } from './utils';

function deriveMegaGeo(states, level) {
  return {
    type: 'FeatureCollection',
    features: states.features.map((feature) => ({
      ...feature,
      id: feature.id + '000',
      properties: {
        ...feature.properties,
        level,
        id: feature.id + '000',
        name: `Rest of ${feature.properties.displayName}`,
        displayName: `Rest of ${feature.properties.displayName}`,
        population: null,
      },
    })),
  };
}

function citiesGeo() {
  return {
    type: 'FeatureCollection',
    features: dsvFormat(';').parse(citiesRaw, (r) => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [Number.parseFloat(r.lat), Number.parseFloat(r.long)],
      },
      properties: {
        name: r.name,
        displayName: r.name,
        population: r.population === 'NaN' || r.population === '' ? null : Number.parseInt(r.population, 10),
      },
    })),
  };
}

/**
 * loads all geo json sources
 * @param {import('.').NameInfo} nationInfo
 * @param {import('.').NameInfo[]} stateInfo
 * @param {import('.').NameInfo[]} countyInfo
 * @param {import('.').NameInfo[]} msaInfo
 * @param {import('.').NameInfo[]} hrrInfo
 * @param {import('.').NameInfo[]} hhsInfo
 * @param {string} megaLevel
 * @param {*} additionalProperties
 */
export default function load(
  nationInfo,
  stateInfo,
  countyInfo,
  msaInfo,
  hrrInfo,
  hhsInfo,
  megaLevel,
  additionalProperties = {},
) {
  const nation = generateGeo(nationTopoJSON, 'nation', [nationInfo], additionalProperties);
  const state = generateGeo(stateTopoJSON, 'state', stateInfo, additionalProperties);
  const county = generateGeo(countyTopoJSON, 'county', countyInfo, additionalProperties);
  const msa = generateGeo(msaTopoJSON, 'msa', msaInfo, additionalProperties);
  const hrr = generateGeo(hrrTopoJSON, 'hrr', hrrInfo, additionalProperties);
  const cities = citiesGeo();
  const hhs = generateGeo(hhsTopoJSON, 'hhs', hhsInfo, additionalProperties);
  // inject city information
  const byCityName = new Map(cities.features.map((d) => [d.properties.name, d.geometry]));
  hhs.center.features.forEach((f) => {
    f.geometry = byCityName.get(f.properties.name);
  });
  nation.center.features.forEach((f) => {
    f.geometry = byCityName.get('Washington');
  });
  const mega = deriveMegaGeo(state.border, megaLevel);
  return {
    state,
    nation,
    county,
    msa,
    hrr,
    hhs,
    mega,
    cities,
  };
}
