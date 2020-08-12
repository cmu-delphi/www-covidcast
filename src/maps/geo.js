import { dsvFormat } from 'd3';
import { feature } from 'topojson-client';
import stateGeoJSON from './processed/state.geojson.json';
import countyGeoJSON from './processed/county.geojson.json';
import msaGeoJSON from './processed/msa.geojson.json';
import zoneGeoJSON from './processed/zone.geojson.json';
import citiesRaw from './processed/cities.csv';

function generateGeo(topo, level, arr, additionalProperties = {}) {
  const byId = new Map(arr.map((s) => [s.id, s]));

  const centers = [];
  const border = feature(topo, level);

  for (const f of border.features) {
    const d = byId.get(f.id);
    const properties = {
      ...d,
      id: d.propertyId,
      ...additionalProperties,
    };

    f.properties = properties;

    centers.push({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [d.lat, d.long],
      },
      id: d.id,
      properties,
    });
  }

  return {
    center: {
      type: 'FeatureCollection',
      features: centers,
    },
    border,
  };
}
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
    features: dsvFormat(',').parse(citiesRaw, (r) => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [Number.parseFloat(r.lat), Number.parseFloat(r.long)],
      },
      properties: {
        displayName: r.name,
        population: r.population === 'NaN' || r.population === '' ? null : Number.parseInt(r.population, 10),
      },
    })),
  };
}

/**
 * loads all geo json sources
 * @param {import('.').NameInfo[]} stateInfo
 * @param {import('.').NameInfo[]} countyInfo
 * @param {import('.').NameInfo[]} msaInfo
 * @param {string} megaLevel
 * @param {*} additionalProperties
 */
export default function load(stateInfo, countyInfo, msaInfo, megaLevel, additionalProperties = {}) {
  const state = generateGeo(stateGeoJSON, 'state', stateInfo, additionalProperties);
  const county = generateGeo(countyGeoJSON, 'county', countyInfo, additionalProperties);
  const msa = generateGeo(msaGeoJSON, 'msa', msaInfo, additionalProperties);
  const zone = feature(zoneGeoJSON, 'zone');
  const mega = deriveMegaGeo(state.border, megaLevel);
  const cities = citiesGeo();
  return {
    state,
    county,
    msa,
    newZones: zone,
    mega,
    cities,
  };
}
